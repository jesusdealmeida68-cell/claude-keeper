-- Distingue anúncios patrocinados de notícias simples na área "Notificações".
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'anuncio' CHECK (type IN ('anuncio', 'noticia'));
