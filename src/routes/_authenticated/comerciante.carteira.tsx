import { createFileRoute } from "@tanstack/react-router";
import { ComercianteShell } from "@/components/comerciante/ComercianteShell";
import { ArrowDownCircle, PlusCircle, Receipt, Wallet2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/comerciante/carteira")({
  component: ComercianteCarteiraPage,
});

const transactions: { desc: string; date: string; amount: string; positive: boolean }[] = [];

function ComercianteCarteiraPage() {
  return (
    <ComercianteShell active="carteira" title="Carteira">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 p-6 text-white shadow-lg shadow-slate-900/20">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
            <Wallet2 className="h-5 w-5" />
          </div>
          <p className="mt-4 text-3xl font-bold tracking-tight">0,00 Kz</p>
          <p className="mt-1 text-sm text-slate-400">Saldo disponível</p>
          <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-2.5 text-sm font-bold text-white hover:bg-blue-400">
            <PlusCircle className="h-4 w-4" /> Adicionar fundos
          </button>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <ArrowDownCircle className="h-5 w-5" />
          </div>
          <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">0,00 Kz</p>
          <p className="mt-1 text-sm text-slate-500">Fundos utilizados este mês</p>
          <p className="mt-5 text-xs text-slate-400">
            Reservado automaticamente ao publicar cada tarefa.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] sm:p-6">
        <h2 className="text-base font-bold text-slate-900">Histórico de transações</h2>
        {transactions.length ? (
          <div className="mt-3 divide-y divide-slate-100">
            {transactions.map((t, i) => (
              <div key={i} className="flex items-center gap-3 py-3.5">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    t.positive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <ArrowDownCircle className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{t.desc}</p>
                  <p className="text-xs text-slate-400">{t.date}</p>
                </div>
                <p
                  className={`shrink-0 text-sm font-bold ${
                    t.positive ? "text-emerald-600" : "text-slate-700"
                  }`}
                >
                  {t.amount}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-dashed border-slate-200 py-10 text-center">
            <Receipt className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-500">Ainda não há transações</p>
          </div>
        )}
      </div>
    </ComercianteShell>
  );
}
