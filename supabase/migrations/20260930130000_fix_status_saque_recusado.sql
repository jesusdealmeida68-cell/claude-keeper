-- BUG: o status das retiradas nunca permitia 'rejected', por isso recusar um
-- saque falhava sempre (violava este CHECK constraint).
ALTER TABLE public.withdrawals DROP CONSTRAINT IF EXISTS withdrawals_status_check;
ALTER TABLE public.withdrawals
  ADD CONSTRAINT withdrawals_status_check CHECK (status IN ('pending', 'paid', 'rejected'));
