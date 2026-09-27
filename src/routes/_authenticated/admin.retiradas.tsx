import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { KygLogo } from "@/components/kyg/KygLogo";
import { getMyRoles } from "@/lib/auth";
import { getAllWithdrawals, markWithdrawalPaid, type WithdrawalWithProfile } from "@/lib/wallet";
import { cn } from "@/lib/utils";
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
import { ArrowLeft, CheckCircle2, Clock, Loader2, MoreVertical, Wallet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/retiradas")({
  component: AdminRetiradasPage,
});

const tabs = [
  { key: "pending", label: "Pendentes", icon: Clock },
  { key: "paid", label: "Pagas", icon: CheckCircle2 },
] as const;

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

function AdminRetiradasPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("pending");
  const [toPay, setToPay] = useState<WithdrawalWithProfile | null>(null);
  const [paying, setPaying] = useState(false);

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles", user.id],
    queryFn: () => getMyRoles(user.id),
  });
  const isAdmin = roles?.includes("admin");

  const { data: withdrawals, isLoading } = useQuery({
    queryKey: ["admin-withdrawals"],
    enabled: !!isAdmin,
    queryFn: getAllWithdrawals,
  });

  const all = useMemo(() => withdrawals ?? [], [withdrawals]);
  const pendingCount = all.filter((w) => w.status === "pending").length;
  const paidCount = all.filter((w) => w.status === "paid").length;
  const filtered = useMemo(() => all.filter((w) => w.status === tab), [all, tab]);

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

  const total = all.reduce((sum, w) => sum + Number(w.amount), 0);
  const totalPending = all
    .filter((w) => w.status === "pending")
    .reduce((sum, w) => sum + Number(w.amount), 0);

  async function confirmPay() {
    if (!toPay) return;
    setPaying(true);
    try {
      await markWithdrawalPaid(toPay.id);
      await queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-withdrawals-summary"] });
      toast.success(`Retirada de ${toPay.profile?.full_name ?? "utilizador"} marcada como paga.`);
      setToPay(null);
    } catch {
      toast.error("Não foi possível marcar como paga.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl bg-background pb-10">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-primary px-5 py-3">
        <KygLogo size="sm" className="bg-card text-primary" />
        <h1 className="text-lg font-semibold text-primary-foreground">Retiradas</h1>
      </header>

      <main className="px-5 pt-5">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <div className="mt-4 grid grid-cols-2 gap-3 animate-fade-up">
          <div className="rounded-3xl bg-primary p-5 text-primary-foreground shadow-card-lg">
            <p className="text-xs text-primary-foreground/70">Por pagar</p>
            <p className="mt-1 text-xl font-bold tracking-tight text-gold">
              {totalPending.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz
            </p>
          </div>
          <div className="rounded-3xl bg-card p-5 shadow-card">
            <p className="text-xs text-muted-foreground">Total histórico</p>
            <p className="mt-1 text-xl font-bold tracking-tight">
              {total.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz
            </p>
          </div>
        </div>

        {/* Abas */}
        <div className="mt-5 flex gap-2">
          {tabs.map((t) => {
            const TIcon = t.icon;
            const count = t.key === "pending" ? pendingCount : paidCount;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
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

        <div className="mt-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-secondary" />
            ))
          ) : !filtered.length ? (
            <div className="rounded-3xl border border-dashed bg-card px-6 py-10 text-center">
              <Wallet className="mx-auto h-9 w-9 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium">
                {tab === "pending" ? "Sem retiradas por pagar" : "Ainda não há retiradas pagas"}
              </p>
            </div>
          ) : (
            filtered.map((w) => (
              <div
                key={w.id}
                className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-sm font-bold text-gold-foreground">
                  {initialsOf(w.profile?.full_name ?? "?")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {w.profile?.full_name ?? "Utilizador"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {w.method === "iban" ? "IBAN" : "Telefone"}: {w.destination ?? "—"} ·{" "}
                    {new Date(w.created_at).toLocaleDateString("pt-AO")}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold">
                  {Number(w.amount).toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz
                </p>
                {w.status === "pending" ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        aria-label="Ações"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary"
                      >
                        <MoreVertical className="h-4.5 w-4.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem onClick={() => setToPay(w)} className="gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" /> Marcar como pago
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                )}
              </div>
            ))
          )}
        </div>
      </main>

      <AlertDialog open={!!toPay} onOpenChange={(open) => !open && setToPay(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar retirada como paga?</AlertDialogTitle>
            <AlertDialogDescription>
              Confirma que já transferiste{" "}
              <span className="font-semibold text-foreground">
                {toPay
                  ? Number(toPay.amount).toLocaleString("pt-AO", { minimumFractionDigits: 2 })
                  : ""}{" "}
                Kz
              </span>{" "}
              para {toPay?.profile?.full_name ?? "o utilizador"}. Ele vai receber uma notificação a
              confirmar o pagamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={paying}
              onClick={confirmPay}
              className="rounded-xl bg-success text-white hover:bg-success/90"
            >
              {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar pagamento"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
