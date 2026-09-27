-- Corrige utilizadores que ficaram sem linha em "profiles" (por exemplo, se o registo
-- falhou a meio antes das correções ao fluxo de criação de conta). Sem isto, esses
-- utilizadores existem em auth.users mas não aparecem em /admin/usuarios.

INSERT INTO public.profiles (user_id, full_name, phone)
SELECT
  au.id,
  COALESCE(NULLIF(au.raw_user_meta_data ->> 'full_name', ''), 'Utilizador'),
  COALESCE(NULLIF(au.raw_user_meta_data ->> 'phone', ''), split_part(au.email, '@', 1))
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id
WHERE p.user_id IS NULL
ON CONFLICT (phone) DO NOTHING;

-- Garante que todo utilizador com perfil também tem o role base 'user'
-- (necessário para ser contado/gerido corretamente no admin).
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'user'
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id AND ur.role = 'user'
WHERE ur.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;
