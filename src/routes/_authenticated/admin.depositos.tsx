import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { KygLogo } from "@/components/kyg/KygLogo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getMyRoles } from "@/lib/auth";
import {
  formatKz,
  friendlyError,
  getAllDeposits,
  getDepositProofUrl,
  reviewDeposit,
} from "@/lib/merchant";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Landmark,
  Loader2,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/depositos")({
  component: AdminDepositosPage,
});

type DepositRow = Awaited<ReturnType<typeof getAllDeposits>>[number];

const tabs = [
  { key: "pending", label: "Pendentes", icon: Clock },
  { key: "approved", label: "Aprovados", icon: CheckCircle2 },
  { key: "rejected", label: "Recusados", icon: XCircle },
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

function AdminDepositosPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("pending");
  const [viewing, setViewing] = useState<DepositRow | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles", user.id],
    queryFn: () => getMyRoles(user.id),
  });
  const isAdmin = roles?.includes("admin");

  const { data: deposits, isLoading } = useQuery({
    queryKey: ["admin-deposits"],
    enabled: !!isAdmin,
    queryFn: getAllDeposits,
  });

  const { data: proofUrl, isLoading: proofLoading } = useQuery({
    queryKey: ["admin-deposit-proof", viewing?.proof_url],
    enabled: !!viewing?.proof_url,
    queryFn: () => getDepositProofUrl(viewing!.proof_url),
  });

  const all = useMemo(() => deposits ?? [], [deposits]);
  const counts = {
    pending: all.filter((d) => d.status === "pending").length,
    approved: all.filter((d) => d.status === "approved").length,
    rejected: all.filter((d) => d.status === "rejected").length,
  };
  const filtered = useMemo(() => all.filter((d) => d.status === tab), [all, tab]);
  const totalPending = all
    .filter((d) => d.status === "pending")
    .reduce((sum, d) => sum + Number(d.amount), 0);
  const totalApproved = all
    .filter((d) => d.status === "approved")
    .reduce((sum, d) => sum + Number(d.amount), 0);

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

  function closeDialog() {
    setViewing(null);
    setRejecting(false);
    setReason("");
  }

  async function handleReview(approve: boolean) {
    if (!viewing) return;
    if (!approve && !reason.trim()) {
      toast.error("Escreve o motivo da recusa.");
      return;
    }
    setBusy(true);
    try {
      await reviewDeposit(viewing.id, approve, approve ? undefined : reason.trim());
      await queryClient.invalidateQueries({ queryKey: ["admin-deposits"] });
      toast.success(
        approve
          ? "Depósito aprovado. O valor foi para a carteira do comerciante."
          : "Depósito recusado.",
      );
      closeDialog();
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl bg-background pb-10">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-primary px-5 py-3">
        <KygLogo size="sm" className="bg-card text-primary" />
        <h1 className="text-lg font-semibold text-primary-foreground">Depósitos</h1>
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
            <p className="text-xs text-primary-foreground/70">Por aprovar</p>
            <p className="mt-1 text-xl font-bold tracking-tight text-gold">
              {formatKz(totalPending)}
            </p>
          </div>
          <div className="rounded-3xl bg-card p-5 shadow-card">
            <p className="text-xs text-muted-foreground">Total aprovado</p>
            <p className="mt-1 text-xl font-bold tracking-tight">{formatKz(totalApproved)}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {tabs.map((t) => {
            const TIcon = t.icon;
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
                  {counts[t.key]}
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
              <Landmark className="mx-auto h-9 w-9 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium">
                {tab === "pending"
                  ? "Sem depósitos por aprovar"
                  : tab === "approved"
                    ? "Ainda não há depósitos aprovados"
                    : "Ainda não há depósitos recusados"}
              </p>
            </div>
          ) : (
            filtered.map((d) => (
              <button
                key={d.id}
                onClick={() => setViewing(d)}
                className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-card transition-colors hover:bg-secondary/60"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-sm font-bold text-gold-foreground">
                  {initialsOf(d.profile?.full_name ?? "?")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {d.profile?.full_name ?? "Utilizador"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {d.profile?.phone ?? "—"} · {new Date(d.created_at).toLocaleString("pt-AO")}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold">{formatKz(Number(d.amount))}</p>
              </button>
            ))
          )}
        </div>
      </main>

      <Dialog open={!!viewing} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>Depósito de comerciante</DialogTitle>
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

              <div className="rounded-2xl border p-4">
                <p className="text-xs text-muted-foreground">Valor depositado</p>
                <p className="text-lg font-bold">{formatKz(Number(viewing.amount))}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Enviado em {new Date(viewing.created_at).toLocaleString("pt-AO")}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Comprovativo
                </p>
                {proofLoading ? (
                  <div className="mt-2 h-40 animate-pulse rounded-2xl bg-secondary" />
                ) : proofUrl ? (
                  <>
                    <img
                      src={proofUrl}
                      alt="Comprovativo do depósito"
                      className="mt-2 max-h-72 w-full rounded-2xl border object-contain"
                    />
                    <a
                      href={proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary underline underline-offset-2"
                    >
                      <ExternalLink className="h-3 w-3" /> Abrir em nova aba
                    </a>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Não foi possível carregar o comprovativo.
                  </p>
                )}
              </div>

              {viewing.status === "pending" ? (
                rejecting ? (
                  <div className="space-y-3">
                    <Textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Motivo da recusa (o comerciante recebe numa notificação)"
                      className="min-h-24 rounded-xl"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() => setRejecting(false)}
                        className="h-11 flex-1 rounded-xl"
                      >
                        Voltar
                      </Button>
                      <Button
                        disabled={busy}
                        onClick={() => handleReview(false)}
                        className="h-11 flex-1 rounded-xl bg-destructive font-semibold text-destructive-foreground hover:bg-destructive/90"
                      >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Recusar"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => setRejecting(true)}
                      className="h-11 flex-1 rounded-xl text-destructive"
                    >
                      <XCircle className="h-4 w-4" /> Recusar
                    </Button>
                    <Button
                      disabled={busy}
                      onClick={() => handleReview(true)}
                      className="h-11 flex-1 rounded-xl bg-success font-semibold text-white hover:bg-success/90"
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" /> Aprovar
                        </>
                      )}
                    </Button>
                  </div>
                )
              ) : viewing.status === "rejected" ? (
                <div className="rounded-2xl bg-destructive-soft p-4 text-sm text-destructive">
                  Recusado{viewing.rejection_reason ? `: ${viewing.rejection_reason}` : "."}
                </div>
              ) : (
                <div className="rounded-2xl bg-success-soft p-4 text-sm font-medium text-success">
                  Depósito aprovado.
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
