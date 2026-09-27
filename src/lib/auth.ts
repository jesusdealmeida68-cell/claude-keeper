import { supabase } from "@/integrations/supabase/client";
import { adminSignUp } from "@/lib/signup.functions";

/** Converte um número de telefone angolano num email sintético para autenticação. */
export function phoneToEmail(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `${digits}@kyg.app`;
}

export async function signUpWithPhone(fullName: string, phone: string, password: string) {
  await adminSignUp({ data: { fullName, phone, password } });
  // A conta já foi criada confirmada no servidor; agora iniciamos sessão normalmente.
  const { data, error } = await supabase.auth.signInWithPassword({
    email: phoneToEmail(phone),
    password,
  });
  if (error) throw error;
  return data;
}

export async function signInWithPhone(phone: string, password: string) {
  const email = phoneToEmail(phone);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function getMyProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data;
}

export async function getMyRoles(userId: string) {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.role as string);
}
