import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { KygLogo } from "@/components/kyg/KygLogo";
import { getMyRoles } from "@/lib/auth";
import { getAllUsers, setUserStarred } from "@/lib/users";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, MoreVertical, Phone, Search, Star, Users, Wallet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  component: AdminUsuariosPage,
});

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

function AdminUsuariosPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles", user.id],
    queryFn: () => getMyRoles(user.id),
  });
  const isAdmin = roles?.includes("admin");

  const {
    data: users,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-users"],
    enabled: !!isAdmin,
    queryFn: getAllUsers,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = users ?? [];
    if (!q) return all;
    return all.filter(
      (u) => u.full_name.toLowerCase().includes(q) || u.phone.toLowerCase().includes(q),
    );
  }, [users, query]);

  const totalBalance = (users ?? []).reduce((sum, u) => sum + (u.balance ?? 0), 0);

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

  async function toggleStar(userId: string, current: boolean) {
    setPending(userId);
    try {
      await setUserStarred(userId, !current);
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(!current ? "Estrela atribuída." : "Estrela removida.");
    } catch {
      toast.error("Não foi possível atualizar.");
    } finally {
      setPending(null);
    }
  }

  async function copyPhone(phone: string) {
    try {
      await navigator.clipboard.writeText(phone);
      toast.success("Telefone copiado.");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl bg-background pb-10">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-primary px-5 py-3">
        <KygLogo size="sm" className="bg-card text-primary" />
        <h1 className="text-lg font-semibold text-primary-foreground">Usuários</h1>
      </header>

      <main className="px-5 pt-5">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <div className="mt-4 grid grid-cols-2 gap-3 animate-fade-up">
          <div className="rounded-3xl bg-card p-4 shadow-card">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-4.5 w-4.5" />
            </div>
            <p className="mt-3 text-xl font-bold tracking-tight">{users?.length ?? 0}</p>
            <p className="text-xs font-medium text-muted-foreground">Utilizadores</p>
          </div>
          <div className="rounded-3xl bg-card p-4 shadow-card">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-soft text-gold-foreground">
              <Wallet className="h-4.5 w-4.5" />
            </div>
            <p className="mt-3 text-xl font-bold tracking-tight">
              {totalBalance.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs font-medium text-muted-foreground">Saldo total (Kz)</p>
          </div>
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Procurar por nome ou telefone…"
            className="w-full rounded-2xl border bg-card py-3 pl-10 pr-4 text-sm shadow-card outline-none ring-gold/40 placeholder:text-muted-foreground focus:ring-2"
          />
        </div>

        <div className="mt-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-secondary" />
            ))
          ) : isError ? (
            <div className="rounded-3xl border border-dashed border-destructive/40 bg-destructive-soft px-6 py-10 text-center">
              <p className="text-sm font-medium text-destructive">
                Não foi possível carregar os utilizadores
              </p>
              <p className="mt-1 text-xs text-destructive/80">
                {error instanceof Error ? error.message : "Erro desconhecido"}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-3 rounded-xl bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground"
              >
                Tentar novamente
              </button>
            </div>
          ) : !filtered.length ? (
            <div className="rounded-3xl border border-dashed bg-card px-6 py-10 text-center">
              <Users className="mx-auto h-9 w-9 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium">
                {query ? "Nenhum resultado encontrado" : "Ainda não existem utilizadores"}
              </p>
            </div>
          ) : (
            filtered.map((u) => (
              <div
                key={u.user_id}
                className="flex items-center gap-3 rounded-2xl bg-card p-3.5 shadow-card"
              >
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
                    avatarColor(u.full_name),
                  )}
                >
                  {initialsOf(u.full_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold">{u.full_name}</p>
                    {u.starred ? (
                      <Star className="h-3.5 w-3.5 shrink-0 fill-gold text-gold" />
                    ) : null}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{u.phone}</p>
                  <p className="mt-0.5 text-xs font-semibold text-primary">
                    {(u.balance ?? 0).toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz ·{" "}
                    <span className="font-normal text-muted-foreground">
                      desde {new Date(u.created_at).toLocaleDateString("pt-AO")}
                    </span>
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      disabled={pending === u.user_id}
                      aria-label="Ações"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary disabled:opacity-50"
                    >
                      <MoreVertical className="h-4.5 w-4.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem
                      onClick={() => toggleStar(u.user_id, u.starred)}
                      className="gap-2"
                    >
                      <Star className={cn("h-4 w-4", u.starred && "fill-gold text-gold")} />
                      {u.starred ? "Remover estrela" : "Dar estrela"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => copyPhone(u.phone)} className="gap-2">
                      <Phone className="h-4 w-4" /> Copiar telefone
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
