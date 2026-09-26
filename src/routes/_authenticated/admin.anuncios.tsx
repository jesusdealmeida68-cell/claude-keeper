import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { KygLogo } from "@/components/kyg/KygLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getMyRoles } from "@/lib/auth";
import {
  type Announcement,
  createAnnouncement,
  deleteAnnouncement,
  getAllAnnouncements,
  setAnnouncementActive,
  uploadAnnouncementImage,
} from "@/lib/announcements";
import { ArrowLeft, ImagePlus, Loader2, Megaphone, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/anuncios")({
  component: AdminAnunciosPage,
});

const emptyForm = {
  sponsorName: "",
  description: "",
  buttonLabel: "Comprar agora",
  buttonUrl: "",
  button2Label: "",
  button2Url: "",
};

function AdminAnunciosPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles", user.id],
    queryFn: () => getMyRoles(user.id),
  });
  const isAdmin = roles?.includes("admin");

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["admin-announcements"],
    enabled: !!isAdmin,
    queryFn: getAllAnnouncements,
  });

  if (!rolesLoading && !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <p className="text-lg font-semibold">Acesso restrito</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Esta área é apenas para administradores.
        </p>
        <Link to="/inicio" className="mt-4 text-sm font-semibold text-gold hover:underline">
          Voltar ao início
        </Link>
      </div>
    );
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Escolhe o logótipo ou imagem do anúncio.");
      return;
    }
    if (!form.sponsorName.trim() || !form.description.trim()) {
      toast.error("Preenche o patrocinador e a descrição.");
      return;
    }
    setSaving(true);
    try {
      const imageUrl = await uploadAnnouncementImage(file);
      await createAnnouncement({
        sponsor_name: form.sponsorName.trim(),
        image_url: imageUrl,
        description: form.description.trim(),
        button_label: form.buttonLabel.trim() || null,
        button_url: form.buttonUrl.trim() || null,
        button2_label: form.button2Label.trim() || null,
        button2_url: form.button2Url.trim() || null,
      });
      await queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      await queryClient.invalidateQueries({ queryKey: ["announcements-active"] });
      toast.success("Anúncio publicado.");
      setForm(emptyForm);
      setFile(null);
      setPreview(null);
    } catch {
      toast.error("Não foi possível publicar o anúncio.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(a: Announcement) {
    try {
      await setAnnouncementActive(a.id, !a.active);
      await queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      await queryClient.invalidateQueries({ queryKey: ["announcements-active"] });
    } catch {
      toast.error("Não foi possível atualizar o anúncio.");
    }
  }

  async function remove(a: Announcement) {
    try {
      await deleteAnnouncement(a.id);
      await queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      await queryClient.invalidateQueries({ queryKey: ["announcements-active"] });
      toast.success("Anúncio removido.");
    } catch {
      toast.error("Não foi possível remover o anúncio.");
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl bg-background pb-16">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-primary px-5 py-3 shadow-card">
        <button
          onClick={() => navigate({ to: "/admin" })}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-primary-foreground"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
        <KygLogo size="sm" className="bg-card text-primary" />
        <h1 className="text-lg font-semibold text-primary-foreground">Anúncios</h1>
      </header>

      <main className="px-5 pt-5">
        <form
          onSubmit={handleCreate}
          className="rounded-3xl bg-card p-5 shadow-card animate-fade-up"
        >
          <div className="flex items-center gap-2">
            <Megaphone className="h-4.5 w-4.5 text-gold" />
            <h2 className="text-base font-semibold">Novo anúncio</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Aparece na área "Notificações" do início, para todos os utilizadores.
          </p>

          <label className="mt-4 flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed bg-secondary/50 text-center transition-colors hover:bg-secondary">
            {preview ? (
              <img src={preview} alt="Pré-visualização" className="h-32 w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1.5 py-8">
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  Logótipo ou imagem do patrocinador
                </span>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </label>

          <div className="mt-4 space-y-3">
            <div>
              <Label htmlFor="sponsor">Patrocinador</Label>
              <Input
                id="sponsor"
                value={form.sponsorName}
                onChange={(e) => setForm((f) => ({ ...f, sponsorName: e.target.value }))}
                placeholder="Ex.: Loja XPTO"
                className="mt-1.5 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Ex.: Promoção especial esta semana, aproveita já!"
                className="mt-1.5 min-h-20 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="btn1label">Botão 1</Label>
                <Input
                  id="btn1label"
                  value={form.buttonLabel}
                  onChange={(e) => setForm((f) => ({ ...f, buttonLabel: e.target.value }))}
                  placeholder="Comprar agora"
                  className="mt-1.5 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="btn1url">Link do botão 1</Label>
                <Input
                  id="btn1url"
                  value={form.buttonUrl}
                  onChange={(e) => setForm((f) => ({ ...f, buttonUrl: e.target.value }))}
                  placeholder="https://…"
                  className="mt-1.5 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="btn2label">Botão 2 (opcional)</Label>
                <Input
                  id="btn2label"
                  value={form.button2Label}
                  onChange={(e) => setForm((f) => ({ ...f, button2Label: e.target.value }))}
                  placeholder="Falar agora"
                  className="mt-1.5 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="btn2url">Link do botão 2</Label>
                <Input
                  id="btn2url"
                  value={form.button2Url}
                  onChange={(e) => setForm((f) => ({ ...f, button2Url: e.target.value }))}
                  placeholder="https://wa.me/…"
                  className="mt-1.5 rounded-xl"
                />
              </div>
            </div>
          </div>

          <Button
            disabled={saving}
            className="mt-5 h-11 w-full rounded-xl bg-primary font-semibold"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Publicar anúncio"}
          </Button>
        </form>

        <div className="mt-6 animate-fade-up [animation-delay:100ms]">
          <h2 className="text-base font-semibold">Anúncios publicados</h2>
          <div className="mt-3 space-y-3">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-secondary" />
              ))
            ) : !announcements?.length ? (
              <div className="rounded-3xl border border-dashed bg-card px-6 py-8 text-center">
                <p className="text-sm font-medium">Ainda não há anúncios</p>
              </div>
            ) : (
              announcements.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card"
                >
                  <img
                    src={a.image_url}
                    alt={a.sponsor_name}
                    className="h-14 w-14 shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{a.sponsor_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.description}</p>
                  </div>
                  <Switch checked={a.active} onCheckedChange={() => toggleActive(a)} />
                  <button
                    onClick={() => remove(a)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-destructive hover:bg-destructive-soft"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
