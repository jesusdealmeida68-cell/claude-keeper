import { createFileRoute } from "@tanstack/react-router";
import { ComercianteShell } from "@/components/comerciante/ComercianteShell";
import { ChevronRight, PlusCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/comerciante/minhas-tarefas")({
  component: ComercianteMinhasTarefasPage,
});

const tasks = [
  {
    name: "Seguir página no Instagram",
    reward: "150 Kz",
    participants: 300,
    concluidas: 214,
    pendentes: 18,
    status: "Ativa",
  },
  {
    name: "Avaliar aplicativo na Play Store",
    reward: "200 Kz",
    participants: 150,
    concluidas: 96,
    pendentes: 12,
    status: "Ativa",
  },
  {
    name: "Subscrever canal no YouTube",
    reward: "100 Kz",
    participants: 200,
    concluidas: 140,
    pendentes: 0,
    status: "Pausada",
  },
  {
    name: "Partilhar publicação no Facebook",
    reward: "120 Kz",
    participants: 250,
    concluidas: 250,
    pendentes: 0,
    status: "Concluída",
  },
  {
    name: "Preencher questionário de satisfação",
    reward: "80 Kz",
    participants: 400,
    concluidas: 380,
    pendentes: 20,
    status: "Concluída",
  },
] as const;

const statusCls: Record<string, string> = {
  Ativa: "bg-emerald-50 text-emerald-600",
  Pausada: "bg-amber-50 text-amber-600",
  Concluída: "bg-slate-100 text-slate-500",
};

function ComercianteMinhasTarefasPage() {
  return (
    <ComercianteShell active="minhas-tarefas" title="Minhas Tarefas">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{tasks.length} tarefas criadas</p>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500"
        >
          <PlusCircle className="h-4 w-4" /> Criar tarefa
        </button>
      </div>

      {/* Tabela — desktop */}
      <div className="mt-4 hidden overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] lg:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3.5 font-semibold">Tarefa</th>
              <th className="px-5 py-3.5 font-semibold">Recompensa</th>
              <th className="px-5 py-3.5 font-semibold">Participantes</th>
              <th className="px-5 py-3.5 font-semibold">Concluídas</th>
              <th className="px-5 py-3.5 font-semibold">Pendentes</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((t) => (
              <tr key={t.name} className="transition-colors hover:bg-slate-50/60">
                <td className="px-5 py-4 font-semibold text-slate-900">{t.name}</td>
                <td className="px-5 py-4 text-slate-600">{t.reward}</td>
                <td className="px-5 py-4 text-slate-600">{t.participants}</td>
                <td className="px-5 py-4 text-slate-600">{t.concluidas}</td>
                <td className="px-5 py-4 text-slate-600">{t.pendentes}</td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusCls[t.status]}`}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <button className="text-sm font-semibold text-blue-600 hover:underline">
                    Ver detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cartões — mobile/tablet */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
        {tasks.map((t) => (
          <div
            key={t.name}
            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold text-slate-900">{t.name}</p>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusCls[t.status]}`}
              >
                {t.status}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-slate-50 py-2">
                <p className="text-sm font-bold text-slate-900">{t.participants}</p>
                <p className="text-[10px] text-slate-500">Participantes</p>
              </div>
              <div className="rounded-xl bg-slate-50 py-2">
                <p className="text-sm font-bold text-slate-900">{t.concluidas}</p>
                <p className="text-[10px] text-slate-500">Concluídas</p>
              </div>
              <div className="rounded-xl bg-slate-50 py-2">
                <p className="text-sm font-bold text-slate-900">{t.pendentes}</p>
                <p className="text-[10px] text-slate-500">Pendentes</p>
              </div>
            </div>
            <button className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700">
              Ver detalhes <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ComercianteShell>
  );
}
