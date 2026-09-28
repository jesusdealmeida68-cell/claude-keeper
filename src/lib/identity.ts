import { supabase } from "@/integrations/supabase/client";

export type IdentityStatus = "pending" | "approved" | "rejected";

export type IdentityVerification = {
  id: string;
  user_id: string;
  front_url: string;
  back_url: string;
  selfie_url: string;
  status: IdentityStatus;
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type IdentityKind = "front" | "back" | "selfie";

export async function uploadIdentityFile(userId: string, file: File, kind: IdentityKind) {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${kind}-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("identidade").upload(path, file);
  if (error) throw error;
  return path;
}

export async function getSignedIdentityUrl(path: string) {
  const { data, error } = await supabase.storage
    .from("identidade")
    .createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export async function createIdentityVerification(input: {
  user_id: string;
  front_url: string;
  back_url: string;
  selfie_url: string;
}) {
  const { error } = await supabase.from("identity_verifications").insert(input);
  if (error) throw error;
}

export async function getMyLatestVerification(userId: string) {
  const { data, error } = await supabase
    .from("identity_verifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as IdentityVerification | null;
}

export async function getAllVerifications() {
  const [{ data: verifications, error: vErr }, { data: profiles, error: pErr }] =
    await Promise.all([
      supabase
        .from("identity_verifications")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name, phone"),
    ]);
  if (vErr) throw vErr;
  if (pErr) throw pErr;

  const byUser = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  return (verifications ?? []).map((v) => ({
    ...(v as IdentityVerification),
    profile: byUser.get(v.user_id) as { full_name: string; phone: string } | undefined,
  }));
}

export async function reviewVerification(
  id: string,
  status: "approved" | "rejected",
  rejectionReason?: string | null,
) {
  const { error } = await supabase
    .from("identity_verifications")
    .update({
      status,
      rejection_reason: status === "rejected" ? (rejectionReason ?? null) : null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}
