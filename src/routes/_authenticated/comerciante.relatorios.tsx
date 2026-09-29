import { createFileRoute } from "@tanstack/react-router";
import { ComercianteShell } from "@/components/comerciante/ComercianteShell";
import { BarChart3, Download, TrendingUp, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/comerciante/relatorios")({
  component: ComercianteRelatoriosPage,
});

const reportCards = [
  {
    label: "Taxa de aprovação",
    value: "92%",
    icon: TrendingUp,
    cls: "text-emerald-600 bg-emerald-50",
  },
  { label: "Participantes únicos", value: "3.180", icon: Users, cls: "text-blue-600 bg-blue-50" },
  {
    label: "Custo médio por conclusão",
    value: "148 Kz",
    icon: BarChart3,
    cls: "text-slate-600 bg-slate-100",
  },
] as const;

function ComercianteRelatoriosPage() {
  return (
    <ComercianteShell active="relatorios" title="Relatórios">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {reportCards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.cls}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">{c.value}</p>
              <p className="mt-0.5 text-sm text-slate-500">{c.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Relatório mensal</h2>
            <p className="text-sm text-slate-500">
              Resumo completo de campanhas, custos e desempenho de Setembro.
            </p>
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800">
            <Download className="h-4 w-4" /> Exportar PDF
          </button>
        </div>
      </div>
    </ComercianteShell>
  );
}
