import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StatusBadge } from "@/components/kyg/StatusBadge";
import { KygLogo } from "@/components/kyg/KygLogo";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile, getMyRoles } from "@/lib/auth";
import { getAppSettings, setSubmissionsBlocked } from "@/lib/wallet";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Ban,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Files,
  LogOut,
  Bell,
  Megaphone,
  MoreVertical,
  Search,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

const tabs = [
  { key: "all", label: "Todos", icon: Files },
  { key: "pending", label: "Pendentes", icon: Clock },
  { key: "approved", label: "Aprovados", icon: CheckCircle2 },
  { key: "rejected", label: "Não aprovados", icon: XCircle },
] as const;

const AVATAR_COLORS = [
  "bg-primary text-primary-foreground",
  "bg-gold text-gold-foreground",
  "bg-success text-white",
  "bg-warning text-white",
  "bg-destructive text-destructive-foreground",
];

function avatarColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

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

function AdminPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isIndex = pathname === "/admin";
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("all");
  const [query, setQuery] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: () => getMyProfile(user.id),
  });

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles", user.id],
    queryFn: () => getMyRoles(user.id),
  });

  const isAdmin = roles?.includes("admin");

  const { data: settings } = useQuery({
    queryKey: ["app-settings"],
    enabled: !!isAdmin,
    queryFn: getAppSettings,
  });
  const blocked = settings?.submissions_blocked ?? false;

  async function handleToggleBlock() {
    try {
      await setSubmissionsBlocked(!blocked);
      await queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      toast.success(!blocked ? "Site bloqueado: envios desativados." : "Site desbloqueado.");
    } catch {
      toast.error("Não foi possível alterar o bloqueio.");
    }
  }

  const { data: submissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ["admin-submissions"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data: subs, error } = await supabase
        .from("submissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone");
      const byUser = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      return (subs ?? []).map((s) => ({
        ...s,
        profile: byUser.get(s.user_id) as { full_name: string; phone: string } | undefined,
      }));
    },
  });

  const all = useMemo(() => submissions ?? [], [submissions]);
  const counts = {
    pending: all.filter((s) => s.status === "pending").length,
    approved: all.filter((s) => s.status === "approved").length,
    rejected: all.filter((s) => s.status === "rejected").length,
    total: all.length,
  };

  const filtered = useMemo(() => {
    const byTab = tab === "all" ? all : all.filter((s) => s.status === tab);
    const q = query.trim().toLowerCase();
    if (!q) return byTab;
    return byTab.filter((s) => {
      const name = s.profile?.full_name?.toLowerCase() ?? "";
      const phone = s.profile?.phone?.toLowerCase() ?? "";
      const service = s.service?.toLowerCase() ?? "";
      return name.includes(q) || phone.includes(q) || service.includes(q);
    });
  }, [all, tab, query]);

  if (!rolesLoading && !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive-soft text-destructive">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <p className="mt-4 text-lg font-semibold">Acesso restrito</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Esta área é apenas para administradores.
        </p>
        <Link to="/inicio" className="mt-4 text-sm font-semibold text-gold hover:underline">
          Voltar ao início
        </Link>
      </div>
    );
  }

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const stats = [
    { label: "Pendentes", value: counts.pending, icon: Clock, cls: "bg-warning-soft text-warning" },
    {
      label: "Aprovados",
      value: counts.approved,
      icon: CheckCircle2,
      cls: "bg-success-soft text-success",
    },
    {
      label: "Não aprovados",
      value: counts.rejected,
      icon: XCircle,
      cls: "bg-destructive-soft text-destructive",
    },
    {
      label: "Total de envios",
      value: counts.total,
      icon: Files,
      cls: "bg-secondary text-foreground",
    },
  ];

  const adminName = profile?.full_name ?? "Administrador";
  const loading = rolesLoading || submissionsLoading;

  if (!isIndex) {
    return <Outlet />;
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl bg-background pb-24">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-primary px-5 py-3 shadow-card">
        <div className="flex items-center gap-3">
          <KygLogo size="sm" className="bg-card text-primary" />
          <h1 className="text-lg font-semibold text-primary-foreground">KYG Admin</h1>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Mais opções"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary-foreground/80 transition-colors hover:bg-white/10 hover:text-primary-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={10} className="w-64 p-0 overflow-hidden">
            <DropdownMenuLabel className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-sm font-bold text-gold-foreground">
                {initialsOf(adminName)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight">{adminName}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">
                  Administrador · KYG
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer gap-3 px-4 py-2.5">
              <Link to="/admin/anuncios">
                <Megaphone className="h-4 w-4 text-muted-foreground" />
                Anúncios
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer gap-3 px-4 py-2.5">
              <Link to="/admin/notificacoes">
                <Bell className="h-4 w-4 text-muted-foreground" />
                Notificações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer gap-3 px-4 py-2.5">
              <Link to="/admin/retiradas">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                Retiradas
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={handleToggleBlock}
              className={cn(
                "cursor-pointer gap-3 px-4 py-2.5",
                blocked && "text-destructive focus:bg-destructive-soft focus:text-destructive",
              )}
            >
              <Ban className="h-4 w-4" />
              {blocked ? "Desbloquear site" : "Bloquear site"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={handleSignOut}
              className="cursor-pointer gap-3 px-4 py-2.5 text-destructive focus:bg-destructive-soft focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main className="px-5 pt-5">
        {/* Cartão de boas-vindas */}
        <div className="flex items-center gap-3 rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-card-lg animate-fade-up">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold text-lg font-bold text-gold-foreground">
            {initialsOf(adminName)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold tracking-tight">
              Olá, {adminName.split(" ")[0]}
            </p>
            <p className="text-xs text-primary-foreground/70">Painel de administração · KYG</p>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="mt-4 grid grid-cols-2 gap-3 animate-fade-up">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-2xl bg-card p-4 shadow-card">
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", s.cls)}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <p className="mt-3 text-2xl font-bold tracking-tight">{s.value}</p>
                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Busca */}
        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Procurar por nome, telefone ou serviço…"
            className="w-full rounded-2xl border bg-card py-3 pl-10 pr-4 text-sm shadow-card outline-none ring-gold/40 placeholder:text-muted-foreground focus:ring-2"
          />
        </div>

        {/* Abas */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {tabs.map((t) => {
            const TIcon = t.icon;
            const count = t.key === "all" ? counts.total : counts[t.key as keyof typeof counts];
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  tab === t.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground shadow-card hover:text-foreground",
                )}
              >
                <TIcon className="h-3.5 w-3.5" />
                {t.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-xs font-semibold",
                    tab === t.key ? "bg-white/20" : "bg-secondary",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Lista */}
        <div className="mt-4 space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
                <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 animate-pulse rounded-full bg-secondary" />
                  <div className="h-2.5 w-2/3 animate-pulse rounded-full bg-secondary" />
                </div>
              </div>
            ))
          ) : !filtered.length ? (
            <div className="rounded-3xl border border-dashed bg-card px-6 py-10 text-center">
              <FileText className="mx-auto h-9 w-9 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium">
                {query ? "Nenhum resultado encontrado" : "Não existem comprovativos"}
              </p>
              {query ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Tenta outro nome, telefone ou serviço.
                </p>
              ) : null}
            </div>
          ) : (
            filtered.map((s) => {
              const profile = s.profile;
              const name = profile?.full_name ?? "Utilizador";
              return (
                <Link
                  key={s.id}
                  to="/admin/$id"
                  params={{ id: s.id }}
                  className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card transition-transform active:scale-[0.99]"
                >
                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
                      avatarColor(name),
                    )}
                  >
                    {initialsOf(name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {profile?.phone ?? "—"} · {s.service}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <StatusBadge status={s.status} />
                      <span className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(s.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                </Link>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
