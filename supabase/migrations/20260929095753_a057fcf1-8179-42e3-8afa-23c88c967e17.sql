ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS merchant_balance numeric NOT NULL DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS merchant_id uuid, ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'outro', ADD COLUMN IF NOT EXISTS proof_type text NOT NULL DEFAULT 'imagem';

CREATE TABLE public.merchant_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  proof_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  rejection_reason text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.merchant_deposits TO authenticated;
GRANT ALL ON public.merchant_deposits TO service_role;
ALTER TABLE public.merchant_deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own or admin read deposits" ON public.merchant_deposits FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users create own pending deposits" ON public.merchant_deposits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE TABLE public.merchant_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  amount numeric NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.merchant_transactions TO authenticated;
GRANT ALL ON public.merchant_transactions TO service_role;
ALTER TABLE public.merchant_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own or admin read transactions" ON public.merchant_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- prevent users editing balances via profile update
CREATE OR REPLACE FUNCTION public.protect_profile_balances()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_setting('kyg.allow_balance', true) = '1' OR public.has_role(auth.uid(),'admin') OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  NEW.balance := OLD.balance;
  NEW.merchant_balance := OLD.merchant_balance;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS protect_profile_balances ON public.profiles;
CREATE TRIGGER protect_profile_balances BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_profile_balances();

CREATE POLICY "Merchants read own tasks" ON public.tasks FOR SELECT TO authenticated USING (merchant_id = auth.uid());
CREATE POLICY "Merchants read submissions of own tasks" ON public.task_submissions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.merchant_id = auth.uid()));
CREATE POLICY "Merchants read tarefas files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'tarefas' AND EXISTS (
    SELECT 1 FROM public.task_submissions ts JOIN public.tasks t ON t.id = ts.task_id
    WHERE ts.evidence_url = storage.objects.name AND t.merchant_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.transfer_to_merchant(_amount numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _bal numeric;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'invalid amount'; END IF;
  SELECT balance INTO _bal FROM profiles WHERE user_id = auth.uid() FOR UPDATE;
  IF _bal IS NULL OR _bal < _amount THEN RAISE EXCEPTION 'insufficient balance'; END IF;
  PERFORM set_config('kyg.allow_balance','1',true);
  UPDATE profiles SET balance = balance - _amount, merchant_balance = merchant_balance + _amount WHERE user_id = auth.uid();
  INSERT INTO merchant_transactions (user_id, kind, amount, description) VALUES (auth.uid(),'transfer',_amount,'Transferência do saldo de utilizador');
END; $$;

CREATE OR REPLACE FUNCTION public.publish_merchant_task(_title text, _description text, _instructions text[], _reward numeric, _slots integer, _category text, _proof_type text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _bal numeric; _total numeric; _id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _title IS NULL OR length(trim(_title)) < 3 OR length(_title) > 120 THEN RAISE EXCEPTION 'invalid title'; END IF;
  IF _description IS NULL OR length(trim(_description)) < 5 OR length(_description) > 2000 THEN RAISE EXCEPTION 'invalid description'; END IF;
  IF _reward IS NULL OR _reward < 10 THEN RAISE EXCEPTION 'invalid reward'; END IF;
  IF _slots IS NULL OR _slots < 1 OR _slots > 100000 THEN RAISE EXCEPTION 'invalid slots'; END IF;
  IF _proof_type NOT IN ('imagem','texto','link') THEN RAISE EXCEPTION 'invalid proof'; END IF;
  _total := _reward * _slots;
  SELECT merchant_balance INTO _bal FROM profiles WHERE user_id = auth.uid() FOR UPDATE;
  IF _bal IS NULL OR _bal < _total THEN RAISE EXCEPTION 'insufficient merchant balance'; END IF;
  PERFORM set_config('kyg.allow_balance','1',true);
  UPDATE profiles SET merchant_balance = merchant_balance - _total WHERE user_id = auth.uid();
  INSERT INTO tasks (title, description, instructions, reward, slots, merchant_id, category, proof_type, estimated_minutes, active)
  VALUES (trim(_title), trim(_description), COALESCE(_instructions,'{}'), _reward, _slots, auth.uid(), COALESCE(_category,'outro'), _proof_type, 5, true)
  RETURNING id INTO _id;
  INSERT INTO merchant_transactions (user_id, kind, amount, description) VALUES (auth.uid(),'publish',-_total,'Tarefa publicada: ' || trim(_title));
  RETURN _id;
END; $$;

CREATE OR REPLACE FUNCTION public.set_merchant_task_active(_task_id uuid, _active boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE tasks SET active = _active WHERE id = _task_id AND merchant_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'task not found'; END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.review_merchant_deposit(_deposit_id uuid, _approve boolean, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid; _amount numeric;
BEGIN
  IF NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'not authorized'; END IF;
  SELECT user_id, amount INTO _uid, _amount FROM merchant_deposits WHERE id = _deposit_id AND status = 'pending';
  IF _uid IS NULL THEN RAISE EXCEPTION 'deposit not found or already reviewed'; END IF;
  UPDATE merchant_deposits SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END, rejection_reason = _reason, reviewed_at = now() WHERE id = _deposit_id;
  IF _approve THEN
    PERFORM set_config('kyg.allow_balance','1',true);
    UPDATE profiles SET merchant_balance = merchant_balance + _amount WHERE user_id = _uid;
    INSERT INTO merchant_transactions (user_id, kind, amount, description) VALUES (_uid,'deposit',_amount,'Depósito via Unitel Money');
  END IF;
  INSERT INTO notifications (user_id, source, kind, title, message) VALUES (_uid,'automatic',
    CASE WHEN _approve THEN 'success' ELSE 'error' END,
    CASE WHEN _approve THEN 'Depósito aprovado' ELSE 'Depósito recusado' END,
    CASE WHEN _approve THEN 'O teu depósito de ' || to_char(_amount,'FM999G999G990D00') || ' Kz foi adicionado à carteira de comerciante.'
      ELSE 'O teu depósito de ' || to_char(_amount,'FM999G999G990D00') || ' Kz foi recusado.' || COALESCE(' Motivo: ' || _reason,'') END);
END; $$;

CREATE OR REPLACE FUNCTION public.review_task_submission(_submission_id uuid, _approve boolean, _review_note text DEFAULT NULL::text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE _uid UUID; _task_id UUID; _reward NUMERIC; _merchant UUID;
BEGIN
  SELECT ts.user_id, ts.task_id, t.reward, t.merchant_id INTO _uid, _task_id, _reward, _merchant
  FROM public.task_submissions ts JOIN public.tasks t ON t.id = ts.task_id
  WHERE ts.id = _submission_id AND ts.status = 'pending';
  IF _uid IS NULL THEN RAISE EXCEPTION 'submission not found or already reviewed'; END IF;
  IF NOT (public.has_role(auth.uid(), 'admin') OR (_merchant IS NOT NULL AND _merchant = auth.uid())) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE public.task_submissions SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,
    review_note = _review_note, reviewed_at = now() WHERE id = _submission_id;
  IF _approve THEN
    PERFORM set_config('kyg.allow_balance','1',true);
    UPDATE public.profiles SET balance = balance + _reward WHERE user_id = _uid;
  END IF;
  INSERT INTO public.notifications (user_id, source, kind, title, message)
  VALUES (_uid, 'automatic', CASE WHEN _approve THEN 'success' ELSE 'error' END,
    CASE WHEN _approve THEN 'Tarefa aprovada' ELSE 'Tarefa não aprovada' END,
    CASE WHEN _approve THEN 'A tua tarefa foi aprovada e ' || to_char(_reward, 'FM999G999G990D00') || ' Kz foram adicionados ao teu saldo.'
      ELSE 'A tua tarefa não foi aprovada.' || COALESCE(' Motivo: ' || _review_note, '') END);
END; $function$;

-- let existing balance-changing functions bypass the protect trigger
CREATE OR REPLACE FUNCTION public.request_withdrawal(_amount numeric, _method text DEFAULT 'phone'::text, _destination text DEFAULT NULL::text)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE _balance NUMERIC; _id UUID;
BEGIN
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'invalid amount'; END IF;
  IF _method NOT IN ('phone', 'iban') THEN RAISE EXCEPTION 'invalid method'; END IF;
  IF _destination IS NULL OR length(trim(_destination)) < 4 OR length(_destination) > 60 THEN RAISE EXCEPTION 'invalid destination'; END IF;
  SELECT balance INTO _balance FROM public.profiles WHERE user_id = auth.uid();
  IF _balance IS NULL OR _balance < _amount THEN RAISE EXCEPTION 'insufficient balance'; END IF;
  PERFORM set_config('kyg.allow_balance','1',true);
  UPDATE public.profiles SET balance = balance - _amount WHERE user_id = auth.uid();
  INSERT INTO public.withdrawals (user_id, amount, status, method, destination)
  VALUES (auth.uid(), _amount, 'pending', _method, trim(_destination)) RETURNING id INTO _id;
  RETURN _id;
END; $function$;

REVOKE EXECUTE ON FUNCTION public.transfer_to_merchant(numeric), public.publish_merchant_task(text,text,text[],numeric,integer,text,text), public.set_merchant_task_active(uuid,boolean), public.review_merchant_deposit(uuid,boolean,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transfer_to_merchant(numeric), public.publish_merchant_task(text,text,text[],numeric,integer,text,text), public.set_merchant_task_active(uuid,boolean), public.review_merchant_deposit(uuid,boolean,text) TO authenticated;