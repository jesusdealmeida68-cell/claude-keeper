import { supabase } from "@/integrations/supabase/client";

export const UNITEL_MONEY = { code: "00930", phone: "973813397" };

export type MerchantTask = {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  reward: number;
  slots: number;
  active: boolean;
  category: string;
  proof_type: string;
  complexity: "basica" | "complexa";
  currency: "KZ" | "USD";
  created_at: string;
};

export type MerchantDeposit = {
  id: string;
  user_id: string;
  amount: number;
  proof_url: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type MerchantTransaction = {
  id: string;
  kind: string;
  amount: number;
  description: string;
  created_at: string;
};

export type MerchantSubmission = {
  id: string;
  task_id: string;
  user_id: string;
  answer_text: string | null;
  evidence_url: string | null;
  status: "pending" | "approved" | "rejected";
  review_note: string | null;
  created_at: string;
  task_title: string;
  user_name: string;
};

export function formatKz(n: number) {
  return `${Number(n || 0).toLocaleString("pt-AO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kz`;
}

export function friendlyError(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? "";
  if (msg.includes("insufficient merchant balance")) return "Saldo da carteira de comerciante insuficiente.";
  if (msg.includes("insufficient balance")) return "Saldo de utilizador insuficiente.";
  if (msg.includes("invalid title")) return "O nome da tarefa deve ter pelo menos 3 letras.";
  if (msg.includes("invalid description")) return "A descrição deve ter pelo menos 5 letras.";
  if (msg.includes("invalid reward"))
    return "Valor abaixo do mínimo: 30 Kz (0.030 USDT) para tarefas básicas, 60 Kz (0.060 USDT) para complexas.";
  if (msg.includes("invalid complexity")) return "Complexidade inválida.";
  if (msg.includes("invalid currency")) return "Moeda inválida.";
  if (msg.includes("invalid slots")) return "Indica uma quantidade de participantes válida.";
  if (msg.includes("invalid amount")) return "Valor inválido.";
  if (msg.includes("invalid proof")) return "Tipo de comprovativo inválido.";
  if (msg.includes("task not found")) return "Tarefa não encontrada.";
  if (msg.includes("already reviewed")) return "Este pedido já foi analisado.";
  if (msg.includes("not authorized")) return "Não tens permissão para esta ação.";
  return "Algo correu mal. Tenta novamente.";
}

export async function getMerchantWallet(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("balance, merchant_balance, full_name")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return {
    balance: Number(data?.balance ?? 0),
    merchant_balance: Number(data?.merchant_balance ?? 0),
    full_name: data?.full_name ?? "",
  };
}

export async function getMyMerchantTasks(userId: string): Promise<MerchantTask[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("merchant_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MerchantTask[];
}

export async function publishTask(input: {
  title: string;
  description: string;
  instructions: string[];
  reward: number;
  slots: number;
  category: string;
  proofType: string;
  complexity: "basica" | "complexa";
  currency: "KZ" | "USD";
}) {
  const { data, error } = await supabase.rpc("publish_merchant_task", {
    _title: input.title,
    _description: input.description,
    _instructions: input.instructions,
    _reward: input.reward,
    _slots: input.slots,
    _category: input.category,
    _proof_type: input.proofType,
    _complexity: input.complexity,
    _currency: input.currency,
  });
  if (error) throw error;
  return data;
}

export async function updateMerchantTask(
  taskId: string,
  input: {
    title: string;
    description: string;
    instructions: string[];
    category: string;
    proofType: string;
    complexity: "basica" | "complexa";
    currency: "KZ" | "USD";
  },
) {
  const { error } = await supabase.rpc("update_merchant_task", {
    _task_id: taskId,
    _title: input.title,
    _description: input.description,
    _instructions: input.instructions,
    _category: input.category,
    _proof_type: input.proofType,
    _complexity: input.complexity,
    _currency: input.currency,
  });
  if (error) throw error;
}

export async function setTaskActive(taskId: string, active: boolean) {
  const { error } = await supabase.rpc("set_merchant_task_active", {
    _task_id: taskId,
    _active: active,
  });
  if (error) throw error;
}

export async function transferToMerchant(amount: number) {
  const { error } = await supabase.rpc("transfer_to_merchant", { _amount: amount });
  if (error) throw error;
}

export async function createDeposit(userId: string, amount: number, file: File) {
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const path = `${userId}/depositos/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage.from("comprovativos").upload(path, file);
  if (upErr) throw upErr;
  const { error } = await supabase
    .from("merchant_deposits")
    .insert({ user_id: userId, amount, proof_url: path, status: "pending" });
  if (error) throw error;
}

export async function getMyDeposits(userId: string): Promise<MerchantDeposit[]> {
  const { data, error } = await supabase
    .from("merchant_deposits")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MerchantDeposit[];
}

export async function getMyTransactions(userId: string): Promise<MerchantTransaction[]> {
  const { data, error } = await supabase
    .from("merchant_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MerchantTransaction[];
}

export async function getMerchantSubmissions(userId: string): Promise<MerchantSubmission[]> {
  const tasks = await getMyMerchantTasks(userId);
  if (!tasks.length) return [];
  const titleById = new Map(tasks.map((t) => [t.id, t.title]));
  const { data, error } = await supabase
    .from("task_submissions")
    .select("*")
    .in("task_id", tasks.map((t) => t.id))
    .order("created_at", { ascending: false });
  if (error) throw error;
  const subs = data ?? [];
  const userIds = Array.from(new Set(subs.map((s) => s.user_id)));
  const nameByUser = new Map<string, string>();
  if (userIds.length) {
    // Perfis de outros utilizadores podem não ser legíveis; usa fallback.
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", userIds);
    (profiles ?? []).forEach((p) => nameByUser.set(p.user_id, p.full_name));
  }
  return subs.map((s) => ({
    ...(s as Omit<MerchantSubmission, "task_title" | "user_name">),
    task_title: titleById.get(s.task_id) ?? "Tarefa",
    user_name: nameByUser.get(s.user_id) ?? `Participante ${s.user_id.slice(0, 6).toUpperCase()}`,
  }));
}

export async function reviewSubmission(id: string, approve: boolean, note?: string) {
  const { error } = await supabase.rpc("review_task_submission", {
    _submission_id: id,
    _approve: approve,
    ...(note ? { _review_note: note } : {}),
  });
  if (error) throw error;
}

export async function getEvidenceUrl(path: string) {
  const { data, error } = await supabase.storage.from("tarefas").createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export async function getDepositProofUrl(path: string) {
  const { data, error } = await supabase.storage.from("comprovativos").createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export async function getAllDeposits() {
  const { data, error } = await supabase
    .from("merchant_deposits")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const deps = (data ?? []) as MerchantDeposit[];
  const ids = Array.from(new Set(deps.map((d) => d.user_id)));
  const byUser = new Map<string, { full_name: string; phone: string }>();
  if (ids.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, phone")
      .in("user_id", ids);
    (profiles ?? []).forEach((p) => byUser.set(p.user_id, p));
  }
  return deps.map((d) => ({ ...d, profile: byUser.get(d.user_id) }));
}

export async function reviewDeposit(id: string, approve: boolean, reason?: string) {
  const { error } = await supabase.rpc("review_merchant_deposit", {
    _deposit_id: id,
    _approve: approve,
    ...(reason ? { _reason: reason } : {}),
  });
  if (error) throw error;
}
