-- Anúncios patrocinados mostrados na área "Notificações" do início.
-- Geridos pelo admin em /admin/anuncios.

CREATE TABLE public.announcements (
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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read active announcements, admins read all"
  ON public.announcements FOR SELECT TO authenticated
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert announcements"
  ON public.announcements FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update announcements"
  ON public.announcements FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete announcements"
  ON public.announcements FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO storage.buckets (id, name, public)
VALUES ('anuncios', 'anuncios', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read anuncios images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'anuncios');

CREATE POLICY "Admins upload anuncios images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'anuncios' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update anuncios images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'anuncios' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete anuncios images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'anuncios' AND public.has_role(auth.uid(), 'admin'));
