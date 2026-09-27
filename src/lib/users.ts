import { supabase } from "@/integrations/supabase/client";

export type AdminUser = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  balance: number;
  starred: boolean;
  created_at: string;
};

export async function getAllUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, user_id, full_name, phone, balance, starred, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as AdminUser[];
}

export async function setUserStarred(userId: string, starred: boolean) {
  const { error } = await supabase.from("profiles").update({ starred }).eq("user_id", userId);
  if (error) throw error;
}
