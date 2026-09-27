-- Concede o papel 'admin' automaticamente à conta com o número 973813397,
-- tanto para quem já existe como para futuros registos com esse telefone.

-- 1) Backfill: se a conta já existir, promove já.
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'
FROM public.profiles
WHERE phone = '973813397'
ON CONFLICT (user_id, role) DO NOTHING;

-- 2) Trigger: se essa conta for criada (ou recriada) no futuro, entra logo como admin.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, kyg_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    public.generate_kyg_code()
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  IF COALESCE(NEW.raw_user_meta_data->>'phone', '') = '973813397' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
