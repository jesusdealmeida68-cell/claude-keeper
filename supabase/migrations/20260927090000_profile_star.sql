-- Adiciona a "estrela" que o admin pode dar a um utilizador, e permite que
-- administradores atualizem o perfil de qualquer utilizador (necessário para
-- marcar/desmarcar a estrela).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS starred BOOLEAN NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Admins update all profiles" ON public.profiles;
CREATE POLICY "Admins update all profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
