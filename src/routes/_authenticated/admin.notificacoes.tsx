import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { KygLogo } from "@/components/kyg/KygLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  type Notification,
  type NotificationKind,
  type ProfileMatch,
  deleteNotification,
  getProfilesByUserIds,
  getSentNotifications,
  searchProfiles,
  sendNotification,
} from "@/lib/notifications";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  Info,
  Loader2,
  Megaphone,
  MoreVertical,
  Search,
  Send,
  Trash2,
  Users,
  X,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/notificacoes")({
  component: AdminNotificacoesPage,
});

const kindOptions: {
  key: NotificationKind;
  label: string;
  icon: typeof Info;
  cls: string;
  active: string;
}[] = [
  {
    key: "info",
    label: "Info",
    icon: Info,
    cls: "bg-secondary text-foreground",
    active: "bg-primary text-primary-foreground",
  },
  {
    key: "alert",
    label: "Alerta",
    icon: AlertTriangle,
    cls: "bg-warning-soft text-warning",
    active: "bg-warning text-white",
  },
  {
    key: "success",
    label: "Sucesso",
    icon: CheckCircle2,
    cls: "bg-success-soft text-success",
    active: "bg-success text-white",
  },
  {
    key: "error",
    label: "Erro",
    icon: XCircle,
    cls: "bg-destructive-soft text-destructive",
    active: "bg-destructive text-destructive-foreground",
  },
];

const kindMeta: Record<NotificationKind, { icon: typeof Info; cls: string }> = {
  info: { icon: Info, cls: "bg-secondary text-foreground" },
  alert: { icon: AlertTriangle, cls: "bg-warning-soft text-warning" },
  success: { icon: CheckCircle2, cls: "bg-success-soft text-success" },
  error: { icon: XCircle, cls: "bg-destructive-soft text-destructive" },
};

function initialsOf(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function AdminNotificacoesPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [kind, setKind] = useState<NotificationKind>("info");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<"all" | "user">("all");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileMatch[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<ProfileMatch | null>(null);
  const [sending, setSending] = useState(false);

  const [toDelete, setToDelete] = useState<Notification | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles", user.id],
    queryFn: () => getMyRoles(user.id),
  });
  const isAdmin = roles?.includes("admin");

  const { data: sent, isLoading } = useQuery({
    queryKey: ["admin-notifications"],
    enabled: !!isAdmin,
    queryFn: getSentNotifications,
  });

  const recipientIds = Array.from(
    new Set((sent ?? []).map((n) => n.user_id).filter((id): id is string => !!id)),
  );

  const { data: recipients } = useQuery({
    queryKey: ["admin-notifications-recipients", recipientIds],
    enabled: recipientIds.length > 0,
    queryFn: () => getProfilesByUserIds(recipientIds),
  });

  useEffect(() => {
    if (audience !== "user" || selected) return;
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const matches = await searchProfiles(q);
        setResults(matches);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, audience, selected]);

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

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error("Preenche o título e a mensagem.");
      return;
    }
    if (audience === "user" && !selected) {
      toast.error("Escolhe o utilizador que vai receber a notificação.");
      return;
    }
    setSending(true);
    try {
      await sendNotification({
        user_id: audience === "user" ? selected!.user_id : null,
        kind,
        title: title.trim(),
        message: message.trim(),
        created_by: user.id,
      });
      await queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      toast.success(
        audience === "user"
          ? `Notificação enviada a ${selected!.full_name}.`
          : "Notificação enviada a todos os utilizadores.",
      );
      setTitle("");
      setMessage("");
      setKind("info");
      setAudience("all");
      setSelected(null);
      setQuery("");
      setResults([]);
    } catch {
      toast.error("Não foi possível enviar a notificação.");
    } finally {
      setSending(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteNotification(toDelete.id);
      await queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      toast.success("Notificação removida.");
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
        <h1 className="text-lg font-semibold text-primary-foreground">Notificações</h1>
      </header>

      <main className="px-5 pt-5">
        <form onSubmit={handleSend} className="rounded-3xl bg-card p-5 shadow-card animate-fade-up">
          <div className="flex items-center gap-2">
            <Bell className="h-4.5 w-4.5 text-gold" />
            <h2 className="text-base font-semibold">Nova notificação</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            As de aprovação/rejeição de comprovativos são enviadas automaticamente. Aqui envias
            alertas e avisos manuais.
          </p>

          {/* Destinatário */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setAudience("all");
                setSelected(null);
                setQuery("");
                setResults([]);
              }}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-colors",
                audience === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground",
              )}
            >
              <Users className="h-4 w-4" /> Todos
            </button>
            <button
              type="button"
              onClick={() => setAudience("user")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-colors",
                audience === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground",
              )}
            >
              <Search className="h-4 w-4" /> Utilizador
            </button>
          </div>

          {audience === "user" ? (
            <div className="relative mt-3">
              {selected ? (
                <div className="flex items-center gap-2 rounded-xl border bg-secondary/40 px-3 py-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold text-xs font-bold text-gold-foreground">
                    {initialsOf(selected.full_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{selected.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{selected.phone}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Nome ou telefone do utilizador…"
                    className="w-full rounded-xl border bg-card py-2.5 pl-10 pr-4 text-sm outline-none ring-gold/40 placeholder:text-muted-foreground focus:ring-2"
                  />
                  {query.trim() ? (
                    <div className="mt-1.5 space-y-1 rounded-xl border bg-card p-1.5 shadow-card">
                      {searching ? (
                        <div className="flex items-center justify-center py-3">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : results.length ? (
                        results.map((p) => (
                          <button
                            key={p.user_id}
                            type="button"
                            onClick={() => {
                              setSelected(p);
                              setResults([]);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-secondary"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold text-xs font-bold text-gold-foreground">
                              {initialsOf(p.full_name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{p.full_name}</p>
                              <p className="truncate text-xs text-muted-foreground">{p.phone}</p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <p className="px-2 py-2 text-xs text-muted-foreground">
                          Nenhum utilizador encontrado.
                        </p>
                      )}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ) : null}

          {/* Tipo */}
          <div className="mt-4 grid grid-cols-4 gap-2">
            {kindOptions.map((k) => {
              const KIcon = k.icon;
              const isActive = kind === k.key;
              return (
                <button
                  key={k.key}
                  type="button"
                  onClick={() => setKind(k.key)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl py-2.5 text-[11px] font-semibold transition-colors",
                    isActive ? k.active : k.cls,
                  )}
                >
                  <KIcon className="h-4 w-4" />
                  {k.label}
                </button>
              );
            })}
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <Label htmlFor="notif-title">Título</Label>
              <Input
                id="notif-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Manutenção agendada"
                className="mt-1.5 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="notif-message">Mensagem</Label>
              <Textarea
                id="notif-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escreve o texto da notificação…"
                className="mt-1.5 min-h-24 rounded-xl"
              />
            </div>
          </div>

          <Button
            disabled={sending}
            className="mt-5 h-11 w-full rounded-xl bg-primary font-semibold"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                <Send className="h-4 w-4" /> Enviar notificação
              </span>
            )}
          </Button>
        </form>

        <div className="mt-6 animate-fade-up [animation-delay:100ms]">
          <h2 className="text-base font-semibold">Enviadas</h2>
          <div className="mt-3 space-y-3">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-secondary" />
              ))
            ) : !sent?.length ? (
              <div className="rounded-3xl border border-dashed bg-card px-6 py-8 text-center">
                <Megaphone className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-3 text-sm font-medium">Ainda não enviaste notificações</p>
              </div>
            ) : (
              sent.map((n) => {
                const meta =
                  kindMeta[
                    (n.kind as NotificationKind) in kindMeta ? (n.kind as NotificationKind) : "info"
                  ];
                const NIcon = meta.icon;
                const recipient = n.user_id ? recipients?.get(n.user_id) : undefined;
                return (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-card"
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                        meta.cls,
                      )}
                    >
                      <NIcon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{n.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {n.message}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          {n.user_id ? (
                            <>
                              <Search className="h-3 w-3" /> {recipient?.full_name ?? "Utilizador"}
                            </>
                          ) : (
                            <>
                              <Users className="h-3 w-3" /> Todos
                            </>
                          )}
                        </span>
                        <span>·</span>
                        <span>
                          {formatDistanceToNow(new Date(n.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary">
                          <MoreVertical className="h-4.5 w-4.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem
                          onClick={() => setToDelete(n)}
                          className="gap-2 text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar notificação?</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.title}" deixa de estar visível para quem a recebeu. Esta ação não pode ser
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
