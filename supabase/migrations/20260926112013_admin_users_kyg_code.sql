-- Adds a unique KYG code and verification flag to profiles, shown in the admin
-- dashboard as "Servidor: KYG-XXXX". Auto-generated for new and existing users.

CREATE OR REPLACE FUNCTION public.generate_kyg_code() RETURNS TEXT LANGUAGE sql AS $$
  SELECT 'KYG-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4))
$$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS kyg_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT true;

UPDATE public.profiles SET kyg_code = public.generate_kyg_code() WHERE kyg_code IS NULL;

ALTER TABLE public.profiles ALTER COLUMN kyg_code SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN kyg_code SET DEFAULT public.generate_kyg_code();

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
  RETURN NEW;
END;
$$;
