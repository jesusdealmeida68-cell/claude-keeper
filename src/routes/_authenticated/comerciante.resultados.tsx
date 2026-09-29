import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ComercianteShell } from "@/components/comerciante/ComercianteShell";
import { cn } from "@/lib/utils";
import { Check, FileImage, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/comerciante/resultados")({
  component: ComercianteResultadosPage,
});

type SubmissionStatus = "Pendente" | "Aprovado" | "Rejeitado";

const initialSubmissions: {
  id: string;
  userId: string;
  task: string;
  proof: string;
  datetime: string;
  status: SubmissionStatus;
}[] = [];

const statusCls: Record<SubmissionStatus, string> = {
  Pendente: "bg-amber-50 text-amber-600",
  Aprovado: "bg-emerald-50 text-emerald-600",
  Rejeitado: "bg-rose-50 text-rose-600",
};

const filters: ("Todos" | SubmissionStatus)[] = ["Todos", "Pendente", "Aprovado", "Rejeitado"];

function ComercianteResultadosPage() {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [filter, setFilter] = useState<(typeof filters)[number]>("Todos");

  function setStatus(id: string, status: SubmissionStatus) {
    setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  }

  const visible = submissions.filter((s) => filter === "Todos" || s.status === filter);

  return (
    <ComercianteShell active="resultados" title="Resultados">
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
            {f}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {visible.map((s) => (
          <div
            key={s.id}
            className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] sm:flex-row sm:items-center"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <FileImage className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-slate-900">{s.userId}</p>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusCls[s.status]}`}
                >
                  {s.status}
                </span>
              </div>
              <p className="mt-0.5 truncate text-sm text-slate-600">{s.task}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {s.proof} · {s.datetime}
              </p>
            </div>
            {s.status === "Pendente" ? (
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => setStatus(s.id, "Aprovado")}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-400 sm:flex-none"
                >
                  <Check className="h-4 w-4" /> Aprovar
                </button>
                <button
                  onClick={() => setStatus(s.id, "Rejeitado")}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 sm:flex-none"
                >
                  <X className="h-4 w-4" /> Rejeitar
                </button>
              </div>
            ) : null}
          </div>
        ))}

        {!visible.length ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-500">Sem envios nesta categoria.</p>
          </div>
        ) : null}
      </div>
    </ComercianteShell>
  );
}
