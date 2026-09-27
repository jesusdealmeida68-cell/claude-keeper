-- Admin marca uma retirada como paga; o utilizador recebe automaticamente
-- uma notificação de confirmação (o "comprovativo" da retirada).

ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.mark_withdrawal_paid(_withdrawal_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID;
  _amount NUMERIC;
  _method TEXT;
  _destination TEXT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT user_id, amount, method, destination
    INTO _uid, _amount, _method, _destination
  FROM public.withdrawals
  WHERE id = _withdrawal_id AND status = 'pending';

  IF _uid IS NULL THEN
    RAISE EXCEPTION 'withdrawal not found or already paid';
  END IF;

  UPDATE public.withdrawals
  SET status = 'paid', paid_at = now()
  WHERE id = _withdrawal_id;

  INSERT INTO public.notifications (user_id, source, kind, title, message)
  VALUES (
    _uid,
    'automatic',
    'success',
    'Retirada paga',
    'A tua retirada de ' || to_char(_amount, 'FM999G999G990D00') || ' Kz para ' ||
      CASE WHEN _method = 'iban' THEN 'o IBAN' ELSE 'o telefone' END || ' ' ||
      COALESCE(_destination, '') || ' foi paga com sucesso.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_withdrawal_paid(UUID) TO authenticated;
