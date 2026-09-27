CREATE POLICY "Users upload own comprovativos" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'comprovativos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users read own comprovativos, admins all" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'comprovativos' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));