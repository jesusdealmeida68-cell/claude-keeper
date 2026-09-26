-- Bloqueio global de envios
CREATE TABLE IF NOT EXISTS public.app_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id = true),
  submissions_blocked BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.app_settings (id, submissions_blocked) VALUES (true, false) ON CONFLICT (id) DO NOTHING;
GRANT SELECT ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads app settings" ON public.app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins update app settings" ON public.app_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Saldo do utilizador
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS balance NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Retiradas
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own withdrawals" ON public.withdrawals FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Admin aprova e paga um valor para o saldo do utilizador (atómico e seguro)
CREATE OR REPLACE FUNCTION public.approve_submission_with_payment(_submission_id UUID, _amount NUMERIC)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid UUID;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF _amount IS NULL OR _amount < 0 THEN
    RAISE EXCEPTION 'invalid amount';
  END IF;
  SELECT user_id INTO _uid FROM public.submissions WHERE id = _submission_id;
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'submission not found';
  END IF;
  UPDATE public.submissions SET status = 'approved', review_note = NULL WHERE id = _submission_id;
  UPDATE public.profiles SET balance = balance + _amount WHERE user_id = _uid;
END;
$$;
GRANT EXECUTE ON FUNCTION public.approve_submission_with_payment(UUID, NUMERIC) TO authenticated;

-- Utilizador pede retirada (desconta do saldo na hora e regista o pedido)
CREATE OR REPLACE FUNCTION public.request_withdrawal(_amount NUMERIC)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _balance NUMERIC; _id UUID;
BEGIN
  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'invalid amount';
  END IF;
  SELECT balance INTO _balance FROM public.profiles WHERE user_id = auth.uid();
  IF _balance IS NULL OR _balance < _amount THEN
    RAISE EXCEPTION 'insufficient balance';
  END IF;
  UPDATE public.profiles SET balance = balance - _amount WHERE user_id = auth.uid();
  INSERT INTO public.withdrawals (user_id, amount, status) VALUES (auth.uid(), _amount, 'pending') RETURNING id INTO _id;
  RETURN _id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(NUMERIC) TO authenticated;
