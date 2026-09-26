import { supabase } from "@/integrations/supabase/client";

export type NotificationKind = "info" | "alert" | "success" | "error";
export type NotificationSource = "manual" | "automatic";

export type Notification = {
  id: string;
  user_id: string | null;
  submission_id: string | null;
  source: NotificationSource;
  kind: NotificationKind;
  title: string;
  message: string;
  created_by: string | null;
  created_at: string;
};

export type SendNotificationInput = {
  user_id: string | null; // null = enviar a todos os utilizadores
  kind: NotificationKind;
  title: string;
  message: string;
  created_by: string;
};

export type ProfileMatch = {
  user_id: string;
  full_name: string;
  phone: string;
};

/** Notificações relevantes para o utilizador: as suas e as globais (user_id nulo). */
export async function getMyNotifications(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .or(`user_id.eq.${userId},user_id.is.null`)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data as Notification[];
}

/** Histórico de notificações manuais enviadas pelo admin. */
export async function getSentNotifications() {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("source", "manual")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Notification[];
}

export async function sendNotification(input: SendNotificationInput) {
  const { error } = await supabase.from("notifications").insert({
    user_id: input.user_id,
    kind: input.kind,
    title: input.title,
    message: input.message,
    created_by: input.created_by,
    source: "manual",
  });
  if (error) throw error;
}

export async function deleteNotification(id: string) {
  const { error } = await supabase.from("notifications").delete().eq("id", id);
  if (error) throw error;
}

/** Pesquisa utilizadores por nome ou telefone, para o admin escolher o destinatário. */
export async function searchProfiles(query: string): Promise<ProfileMatch[]> {
  const q = query.trim();
  if (!q) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, full_name, phone")
    .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`)
    .limit(8);
  if (error) throw error;
  return data as ProfileMatch[];
}

export async function getProfilesByUserIds(userIds: string[]) {
  if (!userIds.length) return new Map<string, { full_name: string; phone: string }>();
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, full_name, phone")
    .in("user_id", userIds);
  if (error) throw error;
  return new Map((data ?? []).map((p) => [p.user_id, { full_name: p.full_name, phone: p.phone }]));
}
