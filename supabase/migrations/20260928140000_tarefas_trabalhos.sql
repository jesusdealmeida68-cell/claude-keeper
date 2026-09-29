-- TRABALHOS (tarefas remuneradas) + submissões dos utilizadores

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  instructions TEXT[] NOT NULL DEFAULT '{}',
  reward NUMERIC(12,2) NOT NULL CHECK (reward >= 0),
  estimated_minutes INT NOT NULL DEFAULT 5,
  slots INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read active tasks, admins read all" ON public.tasks;
CREATE POLICY "Users read active tasks, admins read all"
  ON public.tasks FOR SELECT TO authenticated
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage tasks" ON public.tasks;
CREATE POLICY "Admins manage tasks"
  ON public.tasks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.task_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answer_text TEXT,
  evidence_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE (task_id, user_id)
);

GRANT SELECT, INSERT, UPDATE ON public.task_submissions TO authenticated;
GRANT ALL ON public.task_submissions TO service_role;
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own task submissions, admins read all" ON public.task_submissions;
CREATE POLICY "Users read own task submissions, admins read all"
  ON public.task_submissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users insert own task submissions" ON public.task_submissions;
CREATE POLICY "Users insert own task submissions"
  ON public.task_submissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins update task submissions" ON public.task_submissions;
CREATE POLICY "Admins update task submissions"
  ON public.task_submissions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Bucket privado para a evidência (imagem) enviada em cada tarefa
INSERT INTO storage.buckets (id, name, public)
VALUES ('tarefas', 'tarefas', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users upload own task evidence" ON storage.objects;
CREATE POLICY "Users upload own task evidence"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tarefas' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users read own task evidence, admins read all" ON storage.objects;
CREATE POLICY "Users read own task evidence, admins read all"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'tarefas'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin'))
  );

-- Admin aprova/recusa a submissão; ao aprovar, paga a recompensa fixa da tarefa
CREATE OR REPLACE FUNCTION public.review_task_submission(
  _submission_id UUID,
  _approve BOOLEAN,
  _review_note TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID;
  _task_id UUID;
  _reward NUMERIC;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT ts.user_id, ts.task_id, t.reward INTO _uid, _task_id, _reward
  FROM public.task_submissions ts
  JOIN public.tasks t ON t.id = ts.task_id
  WHERE ts.id = _submission_id AND ts.status = 'pending';

  IF _uid IS NULL THEN
    RAISE EXCEPTION 'submission not found or already reviewed';
  END IF;

  UPDATE public.task_submissions
  SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,
      review_note = _review_note,
      reviewed_at = now()
  WHERE id = _submission_id;

  IF _approve THEN
    UPDATE public.profiles SET balance = balance + _reward WHERE user_id = _uid;
  END IF;

  INSERT INTO public.notifications (user_id, source, kind, title, message)
  VALUES (
    _uid,
    'automatic',
    CASE WHEN _approve THEN 'success' ELSE 'error' END,
    CASE WHEN _approve THEN 'Tarefa aprovada' ELSE 'Tarefa não aprovada' END,
    CASE
      WHEN _approve THEN 'A tua tarefa foi aprovada e ' || to_char(_reward, 'FM999G999G990D00') || ' Kz foram adicionados ao teu saldo.'
      ELSE 'A tua tarefa não foi aprovada.' || COALESCE(' Motivo: ' || _review_note, '')
    END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.review_task_submission(UUID, BOOLEAN, TEXT) TO authenticated;

-- Algumas tarefas de exemplo
INSERT INTO public.tasks (title, description, instructions, reward, estimated_minutes, slots)
SELECT * FROM (VALUES
  ('Avaliação de aplicativo', 'Avalie o aplicativo seguindo as instruções abaixo.',
    ARRAY['Abrir o aplicativo indicado.', 'Realizar a ação solicitada.', 'Enviar a evidência necessária.'],
    30::numeric, 5, 48),
  ('Seguir página nas redes sociais', 'Siga a página indicada e envie a evidência.',
    ARRAY['Abrir a rede social indicada.', 'Seguir a página do parceiro.', 'Enviar print a mostrar que segues.'],
    15::numeric, 3, 60),
  ('Testar novo serviço', 'Experimente o serviço parceiro e partilha a tua opinião.',
    ARRAY['Aceder ao link do serviço.', 'Criar uma conta gratuita.', 'Escrever a tua opinião e enviar evidência.'],
    80::numeric, 10, 20)
) AS v(title, description, instructions, reward, estimated_minutes, slots)
WHERE NOT EXISTS (SELECT 1 FROM public.tasks);
