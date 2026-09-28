import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { KygLogo } from "@/components/kyg/KygLogo";
import { StarRating } from "@/components/kyg/StarRating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getMyRoles } from "@/lib/auth";
import { getAllUsers, setUserRating, type AdminUser } from "@/lib/users";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, Loader2, MoreVertical, Phone, Search, Star, Users, Wallet } from "lucide-react";

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
  const [rating, setRating] = useState<AdminUser | null>(null);
  const [ratingValue, setRatingValue] = useState("0");
  const [savingRating, setSavingRating] = useState(false);

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

  function openRating(u: AdminUser) {
    setRating(u);
    setRatingValue(String(u.rating ?? 0));
  }

  async function saveRating() {
    if (!rating) return;
    const value = Number(ratingValue.replace(",", "."));
    if (Number.isNaN(value) || value < 0 || value > 5) {
      toast.error("Indica um valor entre 0 e 5.");
      return;
    }
    setSavingRating(true);
    try {
      await setUserRating(rating.user_id, value);
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Avaliação guardada.");
      setRating(null);
    } catch {
      toast.error("Não foi possível guardar a avaliação.");
    } finally {
      setSavingRating(false);
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
                  <p className="truncate text-sm font-semibold">{u.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.phone}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <p className="text-xs font-semibold text-primary">
                      {(u.balance ?? 0).toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz
                    </p>
                    <StarRating value={u.rating ?? 0} size="xs" />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    desde {new Date(u.created_at).toLocaleDateString("pt-AO")}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label="Ações"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary disabled:opacity-50"
                    >
                      <MoreVertical className="h-4.5 w-4.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem onClick={() => openRating(u)} className="gap-2">
                      <Star className="h-4 w-4 text-gold" />
                      Avaliar
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

      <Dialog open={!!rating} onOpenChange={(open) => !open && setRating(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Avaliar {rating?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-2">
            <StarRating value={Number(ratingValue.replace(",", ".")) || 0} size="md" />
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              max={5}
              step={0.1}
              value={ratingValue}
              onChange={(e) => setRatingValue(e.target.value)}
              className="h-12 w-32 rounded-xl text-center text-lg font-bold"
            />
            <p className="text-xs text-muted-foreground">De 0 a 5, com casas decimais (ex.: 1.4)</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRating(null)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              disabled={savingRating}
              onClick={saveRating}
              className="rounded-xl bg-primary font-semibold"
            >
              {savingRating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
