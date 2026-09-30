import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ComercianteShell } from "@/components/comerciante/ComercianteShell";
import { cn } from "@/lib/utils";
import {
  formatKz,
  friendlyError,
  getEvidenceUrl,
  getMerchantSubmissions,
  getMerchantWallet,
  reviewSubmission,
  type MerchantSubmission,
} from "@/lib/merchant";
import { Check, FileImage, Loader2, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/comerciante/resultados")({
  component: ComercianteResultadosPage,
});

const statusLabel: Record<MerchantSubmission["status"], string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
};

const statusCls: Record<MerchantSubmission["status"], string> = {
  pending: "bg-amber-50 text-amber-600",
  approved: "bg-emerald-50 text-emerald-600",
  rejected: "bg-rose-50 text-rose-600",
};

const filters: ("Todos" | MerchantSubmission["status"])[] = [
  "Todos",
  "pending",
  "approved",
  "rejected",
];
const filterLabel: Record<(typeof filters)[number], string> = {
  Todos: "Todos",
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
};

function ComercianteResultadosPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<(typeof filters)[number]>("Todos");
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: wallet } = useQuery({
    queryKey: ["merchant-wallet", user.id],
    queryFn: () => getMerchantWallet(user.id),
  });

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["merchant-submissions", user.id],
    queryFn: () => getMerchantSubmissions(user.id),
  });

  async function handleReview(id: string, approve: boolean) {
    setBusyId(id);
    try {
      await reviewSubmission(id, approve);
      await queryClient.invalidateQueries({ queryKey: ["merchant-submissions", user.id] });
      toast.success(approve ? "Envio aprovado. Recompensa paga." : "Envio rejeitado.");
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setBusyId(null);
    }
  }

  async function openEvidence(path: string | null) {
    if (!path) {
      toast.info("Este envio não tem imagem — respondeu por texto ou link.");
      return;
    }
    try {
      const url = await getEvidenceUrl(path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Não foi possível abrir o comprovativo.");
    }
  }

  const visible = (submissions ?? []).filter((s) => filter === "Todos" || s.status === filter);

  return (
    <ComercianteShell
      active="resultados"
      title="Resultados"
      balance={formatKz(wallet?.merchant_balance ?? 0)}
    >
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              filter === f
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.06)] hover:text-slate-800",
            )}
          >
            {filterLabel[f]}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
          ))
        ) : !visible.length ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-500">Sem envios nesta categoria.</p>
          </div>
        ) : (
          visible.map((s) => (
            <div
              key={s.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] sm:flex-row sm:items-center"
            >
              <button
                onClick={() => openEvidence(s.evidence_url)}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-200"
              >
                <FileImage className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-slate-900">{s.user_name}</p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusCls[s.status]}`}
                  >
                    {statusLabel[s.status]}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm text-slate-600">{s.task_title}</p>
                <p className="mt-0.5 truncate text-xs text-slate-400">
                  {s.answer_text ? `"${s.answer_text}" · ` : ""}
                  {new Date(s.created_at).toLocaleString("pt-AO")}
                </p>
              </div>
              {s.status === "pending" ? (
                <div className="flex shrink-0 gap-2">
                  <button
                    disabled={busyId === s.id}
                    onClick={() => handleReview(s.id, true)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-400 disabled:opacity-50 sm:flex-none"
                  >
                    {busyId === s.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Aprovar
                  </button>
                  <button
                    disabled={busyId === s.id}
                    onClick={() => handleReview(s.id, false)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50 sm:flex-none"
                  >
                    <X className="h-4 w-4" /> Rejeitar
                  </button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </ComercianteShell>
  );
}
