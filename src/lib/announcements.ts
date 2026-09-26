import { supabase } from "@/integrations/supabase/client";

export type Announcement = {
  id: string;
  sponsor_name: string;
  image_url: string;
  description: string;
  button_label: string | null;
  button_url: string | null;
  button2_label: string | null;
  button2_url: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
};

export type AnnouncementInput = {
  sponsor_name: string;
  image_url: string;
  description: string;
  button_label?: string | null;
  button_url?: string | null;
  button2_label?: string | null;
  button2_url?: string | null;
};

export async function getActiveAnnouncements() {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Announcement[];
}

export async function getAllAnnouncements() {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Announcement[];
}

export async function uploadAnnouncementImage(file: File) {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("anuncios").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("anuncios").getPublicUrl(path);
  return data.publicUrl;
}

export async function createAnnouncement(input: AnnouncementInput) {
  const { error } = await supabase.from("announcements").insert(input);
  if (error) throw error;
}

export async function setAnnouncementActive(id: string, active: boolean) {
  const { error } = await supabase.from("announcements").update({ active }).eq("id", id);
  if (error) throw error;
}

export async function deleteAnnouncement(id: string) {
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) throw error;
}
