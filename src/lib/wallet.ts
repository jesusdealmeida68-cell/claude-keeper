import { supabase } from "@/integrations/supabase/client";

export type WithdrawalMethod = "phone" | "iban";

export type Withdrawal = {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  method: WithdrawalMethod;
  destination: string | null;
  created_at: string;
};

export type WithdrawalWithProfile = Withdrawal & {
  profile: { full_name: string; phone: string } | undefined;
};

/** Estado global: envios bloqueados ou não. */
export async function getAppSettings() {
  const { data, error } = await supabase
    .from("app_settings")
    .select("submissions_blocked")
    .eq("id", true)
    .maybeSingle();
  if (error) throw error;
  return { submissions_blocked: data?.submissions_blocked ?? false };
}

export async function setSubmissionsBlocked(blocked: boolean) {
  const { error } = await supabase
    .from("app_settings")
    .update({ submissions_blocked: blocked, updated_at: new Date().toISOString() })
    .eq("id", true);
  if (error) throw error;
}

/** Aprova o comprovativo e deposita o valor no saldo do utilizador. */
export async function approveSubmissionWithPayment(submissionId: string, amount: number) {
  const { error } = await supabase.rpc("approve_submission_with_payment", {
    _submission_id: submissionId,
    _amount: amount,
  });
  if (error) throw error;
}

/** Utilizador pede para retirar um valor do seu saldo (por telefone ou IBAN). */
export async function requestWithdrawal(amount: number, method: WithdrawalMethod, destination: string) {
  const { error } = await supabase.rpc("request_withdrawal", {
    _amount: amount,
    _method: method,
    _destination: destination,
  });
  if (error) throw error;
}

/** Lista de retiradas para o admin (com nome/telefone do utilizador). */
export async function getAllWithdrawals(): Promise<WithdrawalWithProfile[]> {
  const { data: withdrawals, error } = await supabase
    .from("withdrawals")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const userIds = Array.from(new Set((withdrawals ?? []).map((w) => w.user_id)));
  let profileByUser = new Map<string, { full_name: string; phone: string }>();
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, phone")
      .in("user_id", userIds);
    profileByUser = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  }

  return (withdrawals ?? []).map((w) => ({ ...w, profile: profileByUser.get(w.user_id) }));
}
