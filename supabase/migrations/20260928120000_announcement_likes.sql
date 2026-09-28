CREATE TABLE IF NOT EXISTS public.announcement_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (announcement_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.announcement_likes TO authenticated;
GRANT ALL ON public.announcement_likes TO service_role;
ALTER TABLE public.announcement_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads likes" ON public.announcement_likes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users like as themselves" ON public.announcement_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users remove own like" ON public.announcement_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
