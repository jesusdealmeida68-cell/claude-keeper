-- Notificações para os utilizadores: automáticas (quando um comprovativo é
-- aprovado/não aprovado) e manuais (escritas pelo admin, ex. alertas).
-- Geridas pelo admin em /admin/notificacoes.

CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = enviada a todos
  submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'automatic')),
  kind TEXT NOT NULL DEFAULT 'info' CHECK (kind IN ('info', 'alert', 'success', 'error')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own and broadcast notifications, admins read all"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX notifications_user_id_idx ON public.notifications (user_id);
CREATE INDEX notifications_created_at_idx ON public.notifications (created_at DESC);

-- Dispara automaticamente uma notificação quando o admin aprova ou rejeita
-- um comprovativo (independentemente de onde a atualização é feita).
CREATE OR REPLACE FUNCTION public.notify_submission_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('approved', 'rejected') THEN
    INSERT INTO public.notifications (user_id, submission_id, source, kind, title, message)
    VALUES (
      NEW.user_id,
      NEW.id,
      'automatic',
      CASE WHEN NEW.status = 'approved' THEN 'success' ELSE 'error' END,
      CASE WHEN NEW.status = 'approved' THEN 'Comprovativo aprovado' ELSE 'Comprovativo não aprovado' END,
      CASE
        WHEN NEW.status = 'approved' THEN 'O teu comprovativo de "' || NEW.service || '" foi aprovado.'
        ELSE 'O teu comprovativo de "' || NEW.service || '" não foi aprovado.' ||
             COALESCE(' Motivo: ' || NEW.review_note, '')
      END
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_submission_reviewed ON public.submissions;
CREATE TRIGGER on_submission_reviewed
  AFTER UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.notify_submission_review();
