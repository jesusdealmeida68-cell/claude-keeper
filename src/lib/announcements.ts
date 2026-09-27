import { supabase } from "@/integrations/supabase/client";

export type AnnouncementType = "anuncio" | "noticia";

export type Announcement = {
  id: string;
  type: AnnouncementType;
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
  type: AnnouncementType;
  sponsor_name: string;
  image_url: string;
  description: string;
  button_label?: string | null;
  button_url?: string | null;
  button2_label?: string | null;
  button2_url?: string | null;
};

/**
 * Recebe o que o admin escreveu num campo de link (URL de site OU número de
 * telefone) e devolve sempre um link pronto a usar:
 * - Já é um link (http/https, wa.me) -> devolve tal como está.
 * - Parece um número de telefone -> devolve link do WhatsApp (wa.me).
 * - Parece um domínio sem "https://" (ex.: "site.co.ao") -> acrescenta o https://.
 */
export function resolveAnnouncementLink(raw: string): string {
  const value = raw.trim();
  if (!value) return "";

  if (/^https?:\/\//i.test(value)) return value;
  if (/^wa\.me\//i.test(value)) return `https://${value}`;
  if (/^(mailto:|tel:)/i.test(value)) return value;

  const digitsOnly = value.replace(/[^\d]/g, "");
  const strippedOfPunctuation = value.replace(/[\s()+-]/g, "");
  const looksLikePhone = digitsOnly.length >= 8 && digitsOnly === strippedOfPunctuation;

  if (looksLikePhone) {
    const phone = digitsOnly.startsWith("244") ? digitsOnly : `244${digitsOnly}`;
    return `https://wa.me/${phone}`;
  }

  if (/^[\w-]+(\.[\w-]+)+([/?#].*)?$/i.test(value)) {
    return `https://${value}`;
  }

  return value;
}

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

export async function updateAnnouncement(id: string, input: Partial<AnnouncementInput>) {
  const { error } = await supabase.from("announcements").update(input).eq("id", id);
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
