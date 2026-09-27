ALTER TABLE public.withdrawals ADD COLUMN method text NOT NULL DEFAULT 'phone' CHECK (method IN ('phone','iban')), ADD COLUMN destination text;

CREATE OR REPLACE FUNCTION public.request_withdrawal(_amount numeric, _method text DEFAULT 'phone', _destination text DEFAULT NULL)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _balance NUMERIC; _id UUID;
BEGIN
  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'invalid amount';
  END IF;
  IF _method NOT IN ('phone', 'iban') THEN
    RAISE EXCEPTION 'invalid method';
  END IF;
  IF _destination IS NULL OR length(trim(_destination)) < 4 OR length(_destination) > 60 THEN
    RAISE EXCEPTION 'invalid destination';
  END IF;
  SELECT balance INTO _balance FROM public.profiles WHERE user_id = auth.uid();
  IF _balance IS NULL OR _balance < _amount THEN
    RAISE EXCEPTION 'insufficient balance';
  END IF;
  UPDATE public.profiles SET balance = balance - _amount WHERE user_id = auth.uid();
  INSERT INTO public.withdrawals (user_id, amount, status, method, destination)
  VALUES (auth.uid(), _amount, 'pending', _method, trim(_destination)) RETURNING id INTO _id;
  RETURN _id;
END;
$function$