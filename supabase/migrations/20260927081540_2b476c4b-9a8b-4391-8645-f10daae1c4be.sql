DROP FUNCTION IF EXISTS public.request_withdrawal(numeric);
REVOKE EXECUTE ON FUNCTION public.request_withdrawal(numeric, text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(numeric, text, text) TO authenticated;