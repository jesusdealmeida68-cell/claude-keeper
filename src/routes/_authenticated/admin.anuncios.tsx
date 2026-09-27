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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getMyRoles } from "@/lib/auth";
import {
  type Announcement,
  type AnnouncementType,
  createAnnouncement,
  deleteAnnouncement,
  getAllAnnouncements,
  resolveAnnouncementLink,
  setAnnouncementActive,
  updateAnnouncement,
  uploadAnnouncementImage,
} from "@/lib/announcements";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  Megaphone,
  MoreVertical,
  Newspaper,
  Pencil,
  Trash2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/anuncios")({
  component: AdminAnunciosPage,
});

type FormState = {
  type: AnnouncementType;
  sponsorName: string;
  description: string;
  buttonLabel: string;
  buttonUrl: string;
  button2Label: string;
  button2Url: string;
};

const emptyForm: FormState = {
  type: "anuncio",
  sponsorName: "",
  description: "",
  buttonLabel: "Comprar agora",
  buttonUrl: "",
  button2Label: "",
  button2Url: "",
};

function toFormState(a: Announcement): FormState {
  return {
    type: a.type,
    sponsorName: a.sponsor_name,
    description: a.description,
    buttonLabel: a.button_label ?? "",
    buttonUrl: a.button_url ?? "",
    button2Label: a.button2_label ?? "",
    button2Url: a.button2_url ?? "",
  };
}

function AdminAnunciosPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState<Announcement | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const [toDelete, setToDelete] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
    await queryClient.invalidateQueries({ queryKey: ["announcements-active"] });
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Escolhe o logótipo ou imagem.");
      return;
    }
    if (!form.sponsorName.trim() || !form.description.trim()) {
      toast.error("Preenche o título e a descrição.");
      return;
    }
    setSaving(true);
    try {
      const imageUrl = await uploadAnnouncementImage(file);
      await createAnnouncement({
        type: form.type,
        sponsor_name: form.sponsorName.trim(),
        image_url: imageUrl,
        description: form.description.trim(),
        button_label: form.buttonLabel.trim() || null,
        button_url: form.buttonUrl.trim() ? resolveAnnouncementLink(form.buttonUrl) : null,
        button2_label: form.button2Label.trim() || null,
        button2_url: form.button2Url.trim() ? resolveAnnouncementLink(form.button2Url) : null,
      });
      await refresh();
      toast.success(form.type === "noticia" ? "Notícia publicada." : "Anúncio publicado.");
      setForm(emptyForm);
      setFile(null);
      setPreview(null);
    } catch {
      toast.error("Não foi possível publicar.");
    } finally {
      setSaving(false);
    }
  }

  function openEdit(a: Announcement) {
    setEditing(a);
    setEditForm(toFormState(a));
    setEditFile(null);
    setEditPreview(null);
  }

  function handleEditFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setEditFile(f);
    setEditPreview(f ? URL.createObjectURL(f) : null);
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    if (!editForm.sponsorName.trim() || !editForm.description.trim()) {
      toast.error("Preenche o título e a descrição.");
      return;
    }
    setEditSaving(true);
    try {
      const imageUrl = editFile ? await uploadAnnouncementImage(editFile) : undefined;
      await updateAnnouncement(editing.id, {
        type: editForm.type,
        sponsor_name: editForm.sponsorName.trim(),
        description: editForm.description.trim(),
        button_label: editForm.buttonLabel.trim() || null,
        button_url: editForm.buttonUrl.trim() ? resolveAnnouncementLink(editForm.buttonUrl) : null,
        button2_label: editForm.button2Label.trim() || null,
        button2_url: editForm.button2Url.trim()
          ? resolveAnnouncementLink(editForm.button2Url)
          : null,
        ...(imageUrl ? { image_url: imageUrl } : {}),
      });
      await refresh();
      toast.success("Alterações guardadas.");
      setEditing(null);
    } catch {
      toast.error("Não foi possível guardar as alterações.");
    } finally {
      setEditSaving(false);
    }
  }

  async function toggleActive(a: Announcement) {
    try {
      await setAnnouncementActive(a.id, !a.active);
      await refresh();
    } catch {
      toast.error("Não foi possível atualizar.");
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteAnnouncement(toDelete.id);
      await refresh();
      toast.success("Removido.");
      setToDelete(null);
    } catch {
      toast.error("Não foi possível remover.");
    } finally {
      setDeleting(false);
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
        <h1 className="text-lg font-semibold text-primary-foreground">Anúncios &amp; Notícias</h1>
      </header>

      <main className="px-5 pt-5">
        <form
          onSubmit={handleCreate}
          className="rounded-3xl bg-card p-5 shadow-card animate-fade-up"
        >
          <div className="flex items-center gap-2">
            <Megaphone className="h-4.5 w-4.5 text-gold" />
            <h2 className="text-base font-semibold">Nova publicação</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Aparece na área "Notificações" do início, para todos os utilizadores.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: "anuncio" }))}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-colors",
                form.type === "anuncio"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground",
              )}
            >
              <Megaphone className="h-4 w-4" /> Anúncio
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: "noticia" }))}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-colors",
                form.type === "noticia"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground",
              )}
            >
              <Newspaper className="h-4 w-4" /> Notícia
            </button>
          </div>

          <label className="mt-4 flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed bg-secondary/50 text-center transition-colors hover:bg-secondary">
            {preview ? (
              <img src={preview} alt="Pré-visualização" className="h-32 w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1.5 py-8">
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  {form.type === "noticia"
                    ? "Imagem da notícia"
                    : "Logótipo ou imagem do patrocinador"}
                </span>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </label>

          <div className="mt-4 space-y-3">
            <div>
              <Label htmlFor="sponsor">{form.type === "noticia" ? "Título" : "Patrocinador"}</Label>
              <Input
                id="sponsor"
                value={form.sponsorName}
                onChange={(e) => setForm((f) => ({ ...f, sponsorName: e.target.value }))}
                placeholder={
                  form.type === "noticia" ? "Ex.: Novo horário de atendimento" : "Ex.: Loja XPTO"
                }
                className="mt-1.5 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Escreve o texto que vai aparecer no cartão…"
                className="mt-1.5 min-h-20 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="btn1label">Botão 1 (opcional)</Label>
                <Input
                  id="btn1label"
                  value={form.buttonLabel}
                  onChange={(e) => setForm((f) => ({ ...f, buttonLabel: e.target.value }))}
                  placeholder="Comprar agora"
                  className="mt-1.5 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="btn1url">Link ou nº WhatsApp</Label>
                <Input
                  id="btn1url"
                  value={form.buttonUrl}
                  onChange={(e) => setForm((f) => ({ ...f, buttonUrl: e.target.value }))}
                  placeholder="923 000 000 ou https://…"
                  className="mt-1.5 rounded-xl"
                />
              </div>
            </div>
            <p className="-mt-1 text-[11px] text-muted-foreground">
              Escreve um número (ex.: 923000000) para abrir o WhatsApp, ou cola um link normal
              para abrir um site — o sistema reconhece sozinho.
            </p>

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
                <Label htmlFor="btn2url">Link ou nº WhatsApp</Label>
                <Input
                  id="btn2url"
                  value={form.button2Url}
                  onChange={(e) => setForm((f) => ({ ...f, button2Url: e.target.value }))}
                  placeholder="923 000 000 ou https://…"
                  className="mt-1.5 rounded-xl"
                />
              </div>
            </div>
          </div>

          <Button
            disabled={saving}
            className="mt-5 h-11 w-full rounded-xl bg-primary font-semibold"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : form.type === "noticia" ? (
              "Publicar notícia"
            ) : (
              "Publicar anúncio"
            )}
          </Button>
        </form>

        <div className="mt-6 animate-fade-up [animation-delay:100ms]">
          <h2 className="text-base font-semibold">Publicações</h2>
          <div className="mt-3 space-y-3">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-secondary" />
              ))
            ) : !announcements?.length ? (
              <div className="rounded-3xl border border-dashed bg-card px-6 py-8 text-center">
                <p className="text-sm font-medium">Ainda não há publicações</p>
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
                    <div className="flex items-center gap-1.5">
                      {a.type === "noticia" ? (
                        <Newspaper className="h-3 w-3 shrink-0 text-muted-foreground" />
                      ) : (
                        <Megaphone className="h-3 w-3 shrink-0 text-gold" />
                      )}
                      <p className="truncate text-sm font-semibold">{a.sponsor_name}</p>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{a.description}</p>
                    <span
                      className={cn(
                        "mt-1 inline-flex items-center gap-1 text-[11px] font-medium",
                        a.active ? "text-success" : "text-muted-foreground",
                      )}
                    >
                      {a.active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {a.active ? "Visível" : "Oculto"}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary">
                        <MoreVertical className="h-4.5 w-4.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem onClick={() => openEdit(a)} className="gap-2">
                        <Pencil className="h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleActive(a)} className="gap-2">
                        {a.active ? (
                          <>
                            <EyeOff className="h-4 w-4" /> Ocultar
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4" /> Mostrar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setToDelete(a)}
                        className="gap-2 text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Editar publicação */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>Editar publicação</DialogTitle>
            <DialogDescription>Atualiza os dados e guarda as alterações.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSave} className="space-y-3">
            <label className="flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed bg-secondary/50 text-center transition-colors hover:bg-secondary">
              <img
                src={editPreview ?? editing?.image_url}
                alt="Pré-visualização"
                className="h-28 w-full object-cover"
              />
              <input type="file" accept="image/*" onChange={handleEditFile} className="hidden" />
              <span className="w-full bg-card py-1.5 text-[11px] font-medium text-muted-foreground">
                Toca para trocar a imagem
              </span>
            </label>

            <div>
              <Label htmlFor="edit-sponsor">
                {editForm.type === "noticia" ? "Título" : "Patrocinador"}
              </Label>
              <Input
                id="edit-sponsor"
                value={editForm.sponsorName}
                onChange={(e) => setEditForm((f) => ({ ...f, sponsorName: e.target.value }))}
                className="mt-1.5 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                className="mt-1.5 min-h-20 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-btn1label">Botão 1</Label>
                <Input
                  id="edit-btn1label"
                  value={editForm.buttonLabel}
                  onChange={(e) => setEditForm((f) => ({ ...f, buttonLabel: e.target.value }))}
                  className="mt-1.5 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="edit-btn1url">Link ou nº WhatsApp</Label>
                <Input
                  id="edit-btn1url"
                  value={editForm.buttonUrl}
                  onChange={(e) => setEditForm((f) => ({ ...f, buttonUrl: e.target.value }))}
                  className="mt-1.5 rounded-xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-btn2label">Botão 2</Label>
                <Input
                  id="edit-btn2label"
                  value={editForm.button2Label}
                  onChange={(e) => setEditForm((f) => ({ ...f, button2Label: e.target.value }))}
                  className="mt-1.5 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="edit-btn2url">Link ou nº WhatsApp</Label>
                <Input
                  id="edit-btn2url"
                  value={editForm.button2Url}
                  onChange={(e) => setEditForm((f) => ({ ...f, button2Url: e.target.value }))}
                  className="mt-1.5 rounded-xl"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(null)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button disabled={editSaving} className="rounded-xl bg-primary font-semibold">
                {editSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmar eliminação */}
      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar publicação?</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.sponsor_name}" deixa de aparecer no início. Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={confirmDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
