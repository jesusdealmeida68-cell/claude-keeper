import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { KygLogo } from "@/components/kyg/KygLogo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getMyRoles } from "@/lib/auth";
import {
  getAllWithdrawals,
  markWithdrawalPaid,
  rejectWithdrawal,
  type WithdrawalWithProfile,
} from "@/lib/wallet";
import { downloadWithdrawalReceipt } from "@/lib/receipt";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  Landmark,
  Loader2,
  MoreVertical,
  Phone,
  Wallet,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/retiradas")({
  component: AdminRetiradasPage,
});

const tabs = [
  { key: "pending", label: "Pendentes", icon: Clock },
  { key: "paid", label: "Pagas", icon: CheckCircle2 },
  { key: "rejected", label: "Recusadas", icon: XCircle },
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
  const [toReject, setToReject] = useState<WithdrawalWithProfile | null>(null);
  const [reason, setReason] = useState("");
  const [viewing, setViewing] = useState<WithdrawalWithProfile | null>(null);
  const [paying, setPaying] = useState(false);
  const [rejecting, setRejecting] = useState(false);

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
  const rejectedCount = all.filter((w) => w.status === "rejected").length;
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

  function receiptOf(w: WithdrawalWithProfile) {
    downloadWithdrawalReceipt({
      id: w.id,
      full_name: w.profile?.full_name ?? "Utilizador",
      phone: w.profile?.phone ?? "—",
      amount: Number(w.amount),
      method: w.method,
      destination: w.destination,
      created_at: w.created_at,
      paid_at: w.paid_at,
    });
  }

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

  async function confirmReject() {
    if (!toReject) return;
    if (!reason.trim()) {
      toast.error("Escreve o motivo da recusa.");
      return;
    }
    setRejecting(true);
    try {
      await rejectWithdrawal(toReject.id, reason.trim());
      await queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-withdrawals-summary"] });
      toast.success("Retirada recusada. O saldo voltou para o utilizador.");
      setToReject(null);
      setReason("");
    } catch {
      toast.error("Não foi possível recusar.");
    } finally {
      setRejecting(false);
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
        <div className="mt-5 flex flex-wrap gap-2">
          {tabs.map((t) => {
            const TIcon = t.icon;
            const count =
              t.key === "pending" ? pendingCount : t.key === "paid" ? paidCount : rejectedCount;
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
                {tab === "pending"
                  ? "Sem retiradas por pagar"
                  : tab === "paid"
                    ? "Ainda não há retiradas pagas"
                    : "Ainda não há retiradas recusadas"}
              </p>
            </div>
          ) : (
            filtered.map((w) => (
              <button
                key={w.id}
                onClick={() => setViewing(w)}
                className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-card transition-colors hover:bg-secondary/60"
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
                      <span
                        role="button"
                        aria-label="Ações"
                        onClick={(e) => e.stopPropagation()}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary"
                      >
                        <MoreVertical className="h-4.5 w-4.5" />
                      </span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-xl"
                    >
                      <DropdownMenuItem onClick={() => setToPay(w)} className="gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" /> Marcar como pago
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setToReject(w)}
                        className="gap-2 text-destructive focus:bg-destructive-soft focus:text-destructive"
                      >
                        <XCircle className="h-4 w-4" /> Recusar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : w.status === "paid" ? (
                  <span
                    role="button"
                    aria-label="Descarregar comprovativo"
                    onClick={(e) => {
                      e.stopPropagation();
                      receiptOf(w);
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-success hover:bg-success-soft"
                  >
                    <Download className="h-4.5 w-4.5" />
                  </span>
                ) : (
                  <XCircle className="h-5 w-5 shrink-0 text-destructive" />
                )}
              </button>
            ))
          )}
        </div>
      </main>

      {/* Confirmar pagamento */}
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

      {/* Recusar com motivo */}
      <Dialog
        open={!!toReject}
        onOpenChange={(open) => {
          if (!open) {
            setToReject(null);
            setReason("");
          }
        }}
      >
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Recusar retirada</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Explica a {toReject?.profile?.full_name ?? "o utilizador"} porque a retirada de{" "}
            <span className="font-semibold text-foreground">
              {toReject
                ? Number(toReject.amount).toLocaleString("pt-AO", { minimumFractionDigits: 2 })
                : ""}{" "}
              Kz
            </span>{" "}
            foi recusada. O valor volta automaticamente para o saldo dele e ele recebe esta mensagem
            numa notificação.
          </p>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex.: Os dados do IBAN não conferem com o teu nome."
            className="min-h-24 rounded-xl"
          />
          <Button
            disabled={rejecting}
            onClick={confirmReject}
            className="h-11 w-full rounded-xl bg-destructive font-semibold text-destructive-foreground hover:bg-destructive/90"
          >
            {rejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Recusar e devolver saldo"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Detalhes */}
      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes da retirada</DialogTitle>
          </DialogHeader>
          {viewing ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-2xl bg-secondary/60 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-sm font-bold text-gold-foreground">
                  {initialsOf(viewing.profile?.full_name ?? "?")}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {viewing.profile?.full_name ?? "Utilizador"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {viewing.profile?.phone ?? "—"}
                  </p>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border p-4">
                <div className="flex items-center gap-3">
                  <Wallet className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Valor a pagar</p>
                    <p className="text-base font-bold">
                      {Number(viewing.amount).toLocaleString("pt-AO", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      Kz
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {viewing.method === "iban" ? (
                    <Landmark className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {viewing.method === "iban" ? "IBAN de destino" : "Telefone de destino"}
                    </p>
                    <p className="truncate text-sm font-semibold">{viewing.destination ?? "—"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Pedido em</p>
                    <p className="text-sm font-semibold">
                      {new Date(viewing.created_at).toLocaleString("pt-AO")}
                    </p>
                  </div>
                </div>

                {viewing.status === "paid" && viewing.paid_at ? (
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Pago em</p>
                      <p className="text-sm font-semibold">
                        {new Date(viewing.paid_at).toLocaleString("pt-AO")}
                      </p>
                    </div>
                  </div>
                ) : null}

                {viewing.status === "rejected" && viewing.rejection_reason ? (
                  <div className="flex items-start gap-3 rounded-xl bg-destructive-soft p-3">
                    <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                    <div className="min-w-0">
                      <p className="text-xs text-destructive/80">Motivo da recusa</p>
                      <p className="text-sm font-semibold text-destructive">
                        {viewing.rejection_reason}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              {viewing.status === "pending" ? (
                <div className="flex gap-2">
                  <Button
                    disabled={paying}
                    onClick={() => {
                      setToPay(viewing);
                      setViewing(null);
                    }}
                    className="h-11 flex-1 rounded-xl bg-success font-semibold text-white hover:bg-success/90"
                  >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" /> Pagar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setToReject(viewing);
                      setViewing(null);
                    }}
                    className="h-11 flex-1 rounded-xl border-destructive font-semibold text-destructive hover:bg-destructive-soft"
                  >
                    <XCircle className="mr-1.5 h-4 w-4" /> Recusar
                  </Button>
                </div>
              ) : viewing.status === "paid" ? (
                <Button
                  onClick={() => receiptOf(viewing)}
                  className="h-11 w-full rounded-xl bg-primary font-semibold"
                >
                  <Download className="mr-1.5 h-4 w-4" /> Baixar comprovativo (PDF)
                </Button>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
