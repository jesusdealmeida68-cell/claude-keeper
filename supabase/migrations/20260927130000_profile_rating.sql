-- Classificação de 0 a 5 (com casas decimais, ex.: 1.4) dada pelo admin a cada utilizador.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) NOT NULL DEFAULT 0
  CHECK (rating >= 0 AND rating <= 5);

-- Aproveita a estrela antiga (true = já tinha destaque) como ponto de partida.
UPDATE public.profiles SET rating = 5 WHERE starred = true AND rating = 0;
