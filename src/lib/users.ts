import { supabase } from "@/integrations/supabase/client";

export type AdminUser = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  balance: number;
  starred: boolean;
  rating: number;
  created_at: string;
};

export async function getAllUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, user_id, full_name, phone, balance, starred, rating, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as AdminUser[];
}

export async function setUserStarred(userId: string, starred: boolean) {
  const { error } = await supabase.from("profiles").update({ starred }).eq("user_id", userId);
  if (error) throw error;
}

export async function setUserRating(userId: string, rating: number) {
  const clamped = Math.max(0, Math.min(5, Math.round(rating * 10) / 10));
  const { error } = await supabase
    .from("profiles")
    .update({ rating: clamped })
    .eq("user_id", userId);
  if (error) throw error;
}
