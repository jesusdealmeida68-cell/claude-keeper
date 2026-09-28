import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/kyg/StatusBadge";
import { Button } from "@/components/ui/button";
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
  getAllVerifications,
  getSignedIdentityUrl,
  reviewVerification,
  type IdentityVerification,
} from "@/lib/identity";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Check, Clock, Files, Loader2, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/identidade")({
  component: AdminIdentidadePage,
});

const tabs = [
  { key: "pending", label: "Pendentes", icon: Clock },
  { key: "approved", label: "Aprovados", icon: Check },
  { key: "rejected", label: "Não aprovados", icon: XCircle },
  { key: "all", label: "Todos", icon: Files },
] as const;

type Row = Awaited<ReturnType<typeof getAllVerifications>>[number];

function ReviewDialog({ row, onClose }: { row: Row; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRejectReason, setShowRejectReason] = useState(false);

  const { data: urls, isLoading: loadingUrls } = useQuery({
    queryKey: ["identity-signed-urls", row.id],
    queryFn: async () => {
      const [front, back, selfie] = await Promise.all([
        getSignedIdentityUrl(row.front_url),
        getSignedIdentityUrl(row.back_url),
        getSignedIdentityUrl(row.selfie_url),
      ]);
      return { front, back, selfie };
    },
  });

  async function handleReview(status: "approved" | "rejected") {
    setLoading(true);
    try {
      await reviewVerification(row.id, status, status === "rejected" ? reason : null);
      await queryClient.invalidateQueries({ queryKey: ["admin-identity-verifications"] });
      toast.success(status === "approved" ? "Utilizador aprovado." : "Utilizador não aprovado.");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível guardar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle>{row.profile?.full_name ?? "Utilizador"}</DialogTitle>
          <DialogDescription>{row.profile?.phone}</DialogDescription>
        </DialogHeader>

        {loadingUrls ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <p className="mb-1 text-[11px] font-medium text-muted-foreground">Frente do BI</p>
              <img src={urls?.front} className="h-32 w-full rounded-xl object-cover" />
            </div>
            <div>
              <p className="mb-1 text-[11px] font-medium text-muted-foreground">Verso do BI</p>
              <img src={urls?.back} className="h-32 w-full rounded-xl object-cover" />
            </div>
            <div className="col-span-2">
              <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                Selfie com o BI
              </p>
              <img src={urls?.selfie} className="h-40 w-full rounded-xl object-cover" />
            </div>
          </div>
        )}

        {row.status === "pending" ? (
          showRejectReason ? (
            <div className="space-y-3">
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Motivo da rejeição (ex.: foto ilegível, documento vencido)"
                className="rounded-xl"
              />
              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setShowRejectReason(false)}
                  disabled={loading}
                >
                  Voltar
                </Button>
                <Button
                  variant="destructive"
                  className="rounded-xl"
                  onClick={() => handleReview("rejected")}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar rejeição"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                variant="outline"
                className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive-soft"
                onClick={() => setShowRejectReason(true)}
                disabled={loading}
              >
                <X className="h-4 w-4" /> Rejeitar
              </Button>
              <Button
                className="rounded-xl bg-success text-white hover:bg-success/90"
                onClick={() => handleReview("approved")}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Aprovar
              </Button>
            </DialogFooter>
          )
        ) : (
          <div className="rounded-xl bg-secondary/60 p-3 text-center text-xs text-muted-foreground">
            {row.status === "approved" ? "Já aprovado." : `Rejeitado: ${row.rejection_reason ?? "—"}`}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AdminIdentidadePage() {
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("pending");
  const [selected, setSelected] = useState<Row | null>(null);

  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin-identity-verifications"],
    queryFn: getAllVerifications,
  });

  const filtered = useMemo(() => {
    if (!rows) return [];
    if (tab === "all") return rows;
    return rows.filter((r) => r.status === tab);
  }, [rows, tab]);

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl bg-background pb-10">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-primary px-5 py-3 shadow-card">
        <Link
          to="/admin"
          className="flex h-9 w-9 items-center justify-center rounded-full text-primary-foreground/80 hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-semibold text-primary-foreground">Verificação de identidade</h1>
      </header>

      <div className="flex gap-2 overflow-x-auto px-5 pt-4 pb-1 [scrollbar-width:none]">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors",
                active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      <main className="px-5 py-4">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Nenhum pedido aqui por enquanto.
          </p>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-card"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {(r.profile?.full_name ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {r.profile?.full_name ?? "Utilizador"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(r.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </button>
            ))}
          </div>
        )}
      </main>

      {selected ? <ReviewDialog row={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}
