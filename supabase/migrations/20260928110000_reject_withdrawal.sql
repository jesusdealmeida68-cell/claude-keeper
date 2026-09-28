-- Admin recusa uma retirada, explicando o motivo. O valor volta para o
-- saldo do utilizador (já tinha sido descontado ao pedir) e o utilizador
-- recebe uma notificação automática com o motivo.

ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

CREATE OR REPLACE FUNCTION public.reject_withdrawal(_withdrawal_id UUID, _reason TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID;
  _amount NUMERIC;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF _reason IS NULL OR trim(_reason) = '' THEN
    RAISE EXCEPTION 'reason is required';
  END IF;

  SELECT user_id, amount INTO _uid, _amount
  FROM public.withdrawals
  WHERE id = _withdrawal_id AND status = 'pending';

  IF _uid IS NULL THEN
    RAISE EXCEPTION 'withdrawal not found or already resolved';
  END IF;

  UPDATE public.withdrawals
  SET status = 'rejected', rejection_reason = _reason
  WHERE id = _withdrawal_id;

  UPDATE public.profiles
  SET balance = balance + _amount
  WHERE user_id = _uid;

  INSERT INTO public.notifications (user_id, source, kind, title, message)
  VALUES (
    _uid,
    'automatic',
    'error',
    'Retirada recusada',
    'A tua retirada de ' || to_char(_amount, 'FM999G999G990D00') || ' Kz foi recusada. Motivo: ' ||
      _reason || '. O valor voltou para o teu saldo.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.reject_withdrawal(UUID, TEXT) TO authenticated;
