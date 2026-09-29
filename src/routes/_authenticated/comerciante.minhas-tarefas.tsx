import { createFileRoute } from "@tanstack/react-router";
import { ComercianteShell } from "@/components/comerciante/ComercianteShell";
import { ListChecks, PlusCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/comerciante/minhas-tarefas")({
  component: ComercianteMinhasTarefasPage,
});

function ComercianteMinhasTarefasPage() {
  return (
    <ComercianteShell active="minhas-tarefas" title="Minhas Tarefas">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">0 tarefas criadas</p>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500"
        >
          <PlusCircle className="h-4 w-4" /> Criar tarefa
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]">
        <ListChecks className="mx-auto h-9 w-9 text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-600">
          Ainda não criaste nenhuma tarefa
        </p>
        <p className="mt-1 text-xs text-slate-400">
          As tarefas que publicares vão aparecer aqui, com participantes, conclusões e estado.
        </p>
      </div>
    </ComercianteShell>
  );
}
