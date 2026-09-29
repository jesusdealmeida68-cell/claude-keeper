import { createFileRoute } from "@tanstack/react-router";
import { ComercianteShell } from "@/components/comerciante/ComercianteShell";
import { ArrowDownCircle, ArrowUpCircle, PlusCircle, Wallet2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/comerciante/carteira")({
  component: ComercianteCarteiraPage,
});

const transactions = [
  { desc: "Adição de fundos", date: "26 Set, 10:12", amount: "+ 100.000 Kz", positive: true },
  {
    desc: "Publicação: Seguir página no Instagram",
    date: "26 Set, 11:00",
    amount: "- 22.500 Kz",
    positive: false,
  },
  {
    desc: "Publicação: Avaliar aplicativo na Play Store",
    date: "25 Set, 16:40",
    amount: "- 30.000 Kz",
    positive: false,
  },
  {
    desc: "Reembolso: tarefa pausada",
    date: "24 Set, 09:15",
    amount: "+ 2.500 Kz",
    positive: true,
  },
] as const;

function ComercianteCarteiraPage() {
  return (
    <ComercianteShell active="carteira" title="Carteira">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 p-6 text-white shadow-lg shadow-slate-900/20">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
            <Wallet2 className="h-5 w-5" />
          </div>
          <p className="mt-4 text-3xl font-bold tracking-tight">50.000 Kz</p>
          <p className="mt-1 text-sm text-slate-400">Saldo disponível</p>
          <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-2.5 text-sm font-bold text-white hover:bg-blue-400">
            <PlusCircle className="h-4 w-4" /> Adicionar fundos
          </button>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <ArrowDownCircle className="h-5 w-5" />
          </div>
          <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">52.500 Kz</p>
          <p className="mt-1 text-sm text-slate-500">Fundos utilizados este mês</p>
          <p className="mt-5 text-xs text-slate-400">
            Reservado automaticamente ao publicar cada tarefa.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] sm:p-6">
        <h2 className="text-base font-bold text-slate-900">Histórico de transações</h2>
        <div className="mt-3 divide-y divide-slate-100">
          {transactions.map((t, i) => (
            <div key={i} className="flex items-center gap-3 py-3.5">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  t.positive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                }`}
              >
                {t.positive ? (
                  <ArrowDownCircle className="h-4.5 w-4.5" />
                ) : (
                  <ArrowUpCircle className="h-4.5 w-4.5" />
                )}
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
      </div>
    </ComercianteShell>
  );
}
