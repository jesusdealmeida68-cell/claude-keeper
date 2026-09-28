-- Verificação de identidade (KYC): BI frente/verso + selfie com o BI.
-- Tabela + bucket privado de storage, seguindo o mesmo padrão de "comprovativos".

CREATE TABLE IF NOT EXISTS public.identity_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  front_url TEXT NOT NULL,
  back_url TEXT NOT NULL,
  selfie_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.identity_verifications TO authenticated;
GRANT ALL ON public.identity_verifications TO service_role;

ALTER TABLE public.identity_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own identity verifications" ON public.identity_verifications;
CREATE POLICY "Users read own identity verifications"
  ON public.identity_verifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users create own identity verifications" ON public.identity_verifications;
CREATE POLICY "Users create own identity verifications"
  ON public.identity_verifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins update identity verifications" ON public.identity_verifications;
CREATE POLICY "Admins update identity verifications"
  ON public.identity_verifications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Bucket privado (documentos sensíveis) — visualizado sempre por link assinado, nunca público.
INSERT INTO storage.buckets (id, name, public)
VALUES ('identidade', 'identidade', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users upload own identity files" ON storage.objects;
CREATE POLICY "Users upload own identity files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'identidade' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users read own identity files, admins read all" ON storage.objects;
CREATE POLICY "Users read own identity files, admins read all"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'identidade'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin'))
  );
