-- Reparação idempotente da tabela "profiles" para a página /admin/usuarios.
-- Migrações anteriores já criaram isto, mas se alguma tiver falhado a meio
-- (por exemplo por uma política já existente noutra tentativa), esta corre
-- de forma 100% idempotente e repõe tudo o que é necessário: colunas,
-- segurança (RLS) e utilizadores em falta.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS balance NUMERIC(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS starred BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;
CREATE POLICY "Admins read all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins update all profiles" ON public.profiles;
CREATE POLICY "Admins update all profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Repõe qualquer utilizador registado que tenha ficado sem linha em "profiles".
INSERT INTO public.profiles (user_id, full_name, phone)
SELECT
  au.id,
  COALESCE(NULLIF(au.raw_user_meta_data ->> 'full_name', ''), 'Utilizador'),
  COALESCE(NULLIF(au.raw_user_meta_data ->> 'phone', ''), split_part(au.email, '@', 1))
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id
WHERE p.user_id IS NULL
ON CONFLICT (phone) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'user'
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id AND ur.role = 'user'
WHERE ur.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;
