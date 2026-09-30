CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS alternate_phone text;

CREATE TABLE public.password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  phone text NOT NULL,
  code_hash text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','issued','used')),
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  issued_at timestamptz,
  used_at timestamptz
);
GRANT SELECT, INSERT ON public.password_resets TO authenticated;
GRANT ALL ON public.password_resets TO service_role;
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own or admin read resets" ON public.password_resets FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users create own pending reset" ON public.password_resets FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending' AND code_hash IS NULL);

CREATE OR REPLACE FUNCTION public.request_password_reset(_phone text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _digits text; _uid uuid;
BEGIN
  _digits := regexp_replace(COALESCE(_phone,''), '\D', '', 'g');
  IF length(_digits) < 9 OR length(_digits) > 15 THEN RAISE EXCEPTION 'invalid phone'; END IF;
  SELECT user_id INTO _uid FROM profiles WHERE regexp_replace(phone,'\D','','g') = _digits LIMIT 1;
  IF _uid IS NULL THEN RETURN; END IF; -- não revela se o número existe
  IF EXISTS (SELECT 1 FROM password_resets WHERE user_id = _uid AND status = 'pending') THEN RETURN; END IF;
  INSERT INTO password_resets (user_id, phone) VALUES (_uid, _digits);
END; $$;

CREATE OR REPLACE FUNCTION public.issue_password_reset_code(_request_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE _code text; _uid uuid;
BEGIN
  IF NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'not authorized'; END IF;
  SELECT user_id INTO _uid FROM password_resets WHERE id = _request_id AND status = 'pending' FOR UPDATE;
  IF _uid IS NULL THEN RAISE EXCEPTION 'request not found or already issued'; END IF;
  _code := lpad(((('x' || encode(extensions.gen_random_bytes(4),'hex'))::bit(32)::bigint % 1000000))::text, 6, '0');
  -- invalida outros códigos emitidos e ainda não usados deste utilizador
  UPDATE password_resets SET status = 'used', used_at = now(), code_hash = NULL
    WHERE user_id = _uid AND status = 'issued';
  UPDATE password_resets SET code_hash = extensions.crypt(_code, extensions.gen_salt('bf')),
    status = 'issued', issued_at = now(), attempts = 0 WHERE id = _request_id;
  RETURN _code;
END; $$;

-- Só o servidor (service_role) chama: valida e consome o código de forma atómica, devolve o user_id.
CREATE OR REPLACE FUNCTION public.consume_password_reset(_phone text, _code text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE _digits text; _row password_resets%ROWTYPE;
BEGIN
  _digits := regexp_replace(COALESCE(_phone,''), '\D', '', 'g');
  IF _code !~ '^\d{6}$' THEN RETURN NULL; END IF;
  SELECT * INTO _row FROM password_resets WHERE phone = _digits AND status = 'issued'
    ORDER BY issued_at DESC LIMIT 1 FOR UPDATE;
  IF _row.id IS NULL THEN RETURN NULL; END IF;
  IF _row.code_hash IS NULL OR extensions.crypt(_code, _row.code_hash) <> _row.code_hash THEN
    UPDATE password_resets SET attempts = attempts + 1,
      status = CASE WHEN attempts + 1 >= 5 THEN 'used' ELSE status END,
      used_at = CASE WHEN attempts + 1 >= 5 THEN now() ELSE used_at END
      WHERE id = _row.id;
    RETURN NULL;
  END IF;
  UPDATE password_resets SET status = 'used', used_at = now() WHERE id = _row.id;
  RETURN _row.user_id;
END; $$;

REVOKE ALL ON FUNCTION public.request_password_reset(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_password_reset(text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.issue_password_reset_code(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.issue_password_reset_code(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.consume_password_reset(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_password_reset(text, text) TO service_role;