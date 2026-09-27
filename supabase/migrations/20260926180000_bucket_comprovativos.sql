-- Bucket para os comprovativos enviados pelos utilizadores (faltava — por isso o upload falhava sempre)
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprovativos', 'comprovativos', false)
ON CONFLICT (id) DO NOTHING;

-- Cada utilizador só pode enviar para a sua própria pasta (primeira parte do caminho = o seu user_id)
CREATE POLICY "Users upload own comprovativos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'comprovativos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Cada utilizador vê os seus próprios ficheiros; admins veem todos (para analisar)
CREATE POLICY "Users read own comprovativos, admins read all"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'comprovativos'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin'))
  );
