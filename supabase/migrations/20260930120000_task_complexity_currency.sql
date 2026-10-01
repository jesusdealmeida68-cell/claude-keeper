-- Identifica tarefas básicas vs complexas (com valor mínimo diferente) e permite
-- ao comerciante escolher a moeda de exibição (Kz ou USDT) ao publicar.
-- O valor é sempre guardado em Kz internamente (ledger único); a moeda só
-- muda como o valor é mostrado (1 USDT = 1000 Kz).

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS complexity TEXT NOT NULL DEFAULT 'basica'
    CHECK (complexity IN ('basica', 'complexa')),
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'KZ'
    CHECK (currency IN ('KZ', 'USD'));

DROP FUNCTION IF EXISTS public.publish_merchant_task(text,text,text[],numeric,integer,text,text);

CREATE OR REPLACE FUNCTION public.publish_merchant_task(
  _title TEXT, _description TEXT, _instructions TEXT[], _reward NUMERIC, _slots INTEGER,
  _category TEXT, _proof_type TEXT,
  _complexity TEXT DEFAULT 'basica', _currency TEXT DEFAULT 'KZ'
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _bal NUMERIC; _total NUMERIC; _id UUID; _min NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _title IS NULL OR length(trim(_title)) < 3 OR length(_title) > 120 THEN RAISE EXCEPTION 'invalid title'; END IF;
  IF _description IS NULL OR length(trim(_description)) < 5 OR length(_description) > 2000 THEN RAISE EXCEPTION 'invalid description'; END IF;
  IF _complexity NOT IN ('basica', 'complexa') THEN RAISE EXCEPTION 'invalid complexity'; END IF;
  IF _currency NOT IN ('KZ', 'USD') THEN RAISE EXCEPTION 'invalid currency'; END IF;
  _min := CASE WHEN _complexity = 'complexa' THEN 60 ELSE 30 END;
  IF _reward IS NULL OR _reward < _min THEN RAISE EXCEPTION 'invalid reward'; END IF;
  IF _slots IS NULL OR _slots < 1 OR _slots > 100000 THEN RAISE EXCEPTION 'invalid slots'; END IF;
  IF _proof_type NOT IN ('imagem','texto','link') THEN RAISE EXCEPTION 'invalid proof'; END IF;
  _total := _reward * _slots;
  SELECT merchant_balance INTO _bal FROM profiles WHERE user_id = auth.uid() FOR UPDATE;
  IF _bal IS NULL OR _bal < _total THEN RAISE EXCEPTION 'insufficient merchant balance'; END IF;
  PERFORM set_config('kyg.allow_balance','1',true);
  UPDATE profiles SET merchant_balance = merchant_balance - _total WHERE user_id = auth.uid();
  INSERT INTO tasks (title, description, instructions, reward, slots, merchant_id, category, proof_type, estimated_minutes, active, complexity, currency)
  VALUES (trim(_title), trim(_description), COALESCE(_instructions,'{}'), _reward, _slots, auth.uid(), COALESCE(_category,'outro'), _proof_type, 5, true, _complexity, _currency)
  RETURNING id INTO _id;
  INSERT INTO merchant_transactions (user_id, kind, amount, description) VALUES (auth.uid(),'publish',-_total,'Tarefa publicada: ' || trim(_title));
  RETURN _id;
END; $$;

-- Esta função era chamada pelo frontend mas nunca tinha sido criada (editar tarefa falhava).
CREATE OR REPLACE FUNCTION public.update_merchant_task(
  _task_id UUID, _title TEXT, _description TEXT, _instructions TEXT[],
  _category TEXT, _proof_type TEXT,
  _complexity TEXT DEFAULT 'basica', _currency TEXT DEFAULT 'KZ'
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _title IS NULL OR length(trim(_title)) < 3 OR length(_title) > 120 THEN RAISE EXCEPTION 'invalid title'; END IF;
  IF _description IS NULL OR length(trim(_description)) < 5 OR length(_description) > 2000 THEN RAISE EXCEPTION 'invalid description'; END IF;
  IF _proof_type NOT IN ('imagem','texto','link') THEN RAISE EXCEPTION 'invalid proof'; END IF;
  IF _complexity NOT IN ('basica', 'complexa') THEN RAISE EXCEPTION 'invalid complexity'; END IF;
  IF _currency NOT IN ('KZ', 'USD') THEN RAISE EXCEPTION 'invalid currency'; END IF;
  UPDATE tasks SET
    title = trim(_title), description = trim(_description), instructions = COALESCE(_instructions,'{}'),
    category = COALESCE(_category,'outro'), proof_type = _proof_type,
    complexity = _complexity, currency = _currency
  WHERE id = _task_id AND merchant_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'task not found'; END IF;
END; $$;

REVOKE EXECUTE ON FUNCTION
  public.publish_merchant_task(text,text,text[],numeric,integer,text,text,text,text),
  public.update_merchant_task(uuid,text,text,text[],text,text,text,text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION
  public.publish_merchant_task(text,text,text[],numeric,integer,text,text,text,text),
  public.update_merchant_task(uuid,text,text,text[],text,text,text,text)
TO authenticated;
