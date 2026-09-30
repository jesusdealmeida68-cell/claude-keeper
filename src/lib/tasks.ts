import { supabase } from "@/integrations/supabase/client";

export type Task = {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  reward: number;
  estimated_minutes: number;
  slots: number;
  active: boolean;
  category: string;
  created_at: string;
};

export const categoryLabel: Record<string, string> = {
  "redes-sociais": "Redes sociais",
  avaliacoes: "Avaliações e reviews",
  downloads: "Downloads de app",
  pesquisas: "Pesquisas e questionários",
  outro: "Outro",
};

export type TaskSubmissionStatus = "pending" | "approved" | "rejected";

export type TaskSubmission = {
  id: string;
  task_id: string;
  user_id: string;
  answer_text: string | null;
  evidence_url: string | null;
  status: TaskSubmissionStatus;
  review_note: string | null;
  created_at: string;
  reviewed_at: string | null;
};

export async function getActiveTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Task[];
}

// Quantas vagas já foram ocupadas (envios em análise ou aprovados) por tarefa.
export async function getTaskSlotsTaken(): Promise<Map<string, number>> {
  const { data, error } = await supabase.rpc("get_task_slots_taken" as never);
  if (error) throw error;
  const rows = (data ?? []) as unknown as { task_id: string; taken: number }[];
  return new Map(rows.map((r) => [r.task_id, Number(r.taken)]));
}

export function slotsLeft(task: Pick<Task, "id" | "slots">, taken: Map<string, number> | undefined) {
  return Math.max(0, task.slots - (taken?.get(task.id) ?? 0));
}

export async function getTaskById(id: string): Promise<Task> {
  const { data, error } = await supabase.from("tasks").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Task;
}

export async function getMyTaskSubmission(
  userId: string,
  taskId: string,
): Promise<TaskSubmission | null> {
  const { data, error } = await supabase
    .from("task_submissions")
    .select("*")
    .eq("user_id", userId)
    .eq("task_id", taskId)
    .maybeSingle();
  if (error) throw error;
  return (data as TaskSubmission) ?? null;
}

export async function getTasksByIds(ids: string[]): Promise<Task[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("tasks").select("*").in("id", ids);
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function getMyTaskSubmissions(userId: string): Promise<TaskSubmission[]> {
  const { data, error } = await supabase.from("task_submissions").select("*").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []) as TaskSubmission[];
}

export async function submitTask(input: {
  taskId: string;
  userId: string;
  answerText: string;
  evidenceFile: File;
}) {
  const ext = input.evidenceFile.name.split(".").pop() ?? "jpg";
  const path = `${input.userId}/${input.taskId}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("tarefas")
    .upload(path, input.evidenceFile, { upsert: true });
  if (uploadError) throw uploadError;

  const { error } = await supabase.from("task_submissions").insert({
    task_id: input.taskId,
    user_id: input.userId,
    answer_text: input.answerText,
    evidence_url: path,
    status: "pending",
  });
  if (error) throw error;
}

export async function getTaskEvidenceUrl(path: string) {
  const { data, error } = await supabase.storage.from("tarefas").createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}
