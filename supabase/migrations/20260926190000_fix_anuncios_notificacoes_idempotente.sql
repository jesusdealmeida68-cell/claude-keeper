-- ANÚNCIOS / NOTÍCIAS
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sponsor_name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT NOT NULL,
  button_label TEXT,
  button_url TEXT,
  button2_label TEXT,
  button2_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'anuncio' CHECK (type IN ('anuncio', 'noticia'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read active announcements, admins read all" ON public.announcements;
CREATE POLICY "Users read active announcements, admins read all"
  ON public.announcements FOR SELECT TO authenticated
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins insert announcements" ON public.announcements;
CREATE POLICY "Admins insert announcements"
  ON public.announcements FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update announcements" ON public.announcements;
CREATE POLICY "Admins update announcements"
  ON public.announcements FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete announcements" ON public.announcements;
CREATE POLICY "Admins delete announcements"
  ON public.announcements FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO storage.buckets (id, name, public)
VALUES ('anuncios', 'anuncios', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read anuncios images" ON storage.objects;
CREATE POLICY "Public read anuncios images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'anuncios');

DROP POLICY IF EXISTS "Admins upload anuncios images" ON storage.objects;
CREATE POLICY "Admins upload anuncios images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'anuncios' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update anuncios images" ON storage.objects;
CREATE POLICY "Admins update anuncios images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'anuncios' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete anuncios images" ON storage.objects;
CREATE POLICY "Admins delete anuncios images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'anuncios' AND public.has_role(auth.uid(), 'admin'));

-- NOTIFICAÇÕES (manuais + automáticas)
CREATE TABLE IF NOT EXISTS public.notifications (
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

DROP POLICY IF EXISTS "Users read own and broadcast notifications, admins read all" ON public.notifications;
CREATE POLICY "Users read own and broadcast notifications, admins read all"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins insert notifications" ON public.notifications;
CREATE POLICY "Admins insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete notifications" ON public.notifications;
CREATE POLICY "Admins delete notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications (created_at DESC);

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
