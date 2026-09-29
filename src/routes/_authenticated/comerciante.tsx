import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ComercianteShell } from "@/components/comerciante/ComercianteShell";
import { CheckCircle2, Clock3, ListChecks, Wallet2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/comerciante")({
  component: ComercianteVisaoGeralPage,
});

const performance = [
  { dia: "Seg", concluidas: 0 },
  { dia: "Ter", concluidas: 0 },
  { dia: "Qua", concluidas: 0 },
  { dia: "Qui", concluidas: 0 },
  { dia: "Sex", concluidas: 0 },
  { dia: "Sáb", concluidas: 0 },
  { dia: "Dom", concluidas: 0 },
];

const cards = [
  {
    label: "Saldo disponível",
    value: "0,00 Kz",
    icon: Wallet2,
    accent: "from-blue-500 to-blue-600",
  },
  {
    label: "Tarefas ativas",
    value: "0",
    icon: ListChecks,
    accent: "from-slate-700 to-slate-900",
  },
  {
    label: "Tarefas concluídas",
    value: "0",
    icon: CheckCircle2,
    accent: "from-emerald-500 to-emerald-600",
  },
  {
    label: "Pendentes de aprovação",
    value: "0",
    icon: Clock3,
    accent: "from-amber-500 to-amber-600",
  },
] as const;

const recentTasks: { name: string; reward: string; status: string }[] = [];

const statusCls: Record<string, string> = {
  Ativa: "bg-emerald-50 text-emerald-600",
  Pausada: "bg-amber-50 text-amber-600",
  Concluída: "bg-slate-100 text-slate-500",
};

function ComercianteVisaoGeralPage() {
  return (
    <ComercianteShell active="visao-geral" title="Visão Geral">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${c.accent} text-white shadow-md`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">{c.value}</p>
              <p className="mt-0.5 text-sm text-slate-500">{c.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Desempenho das tarefas</h2>
            <p className="text-sm text-slate-500">Conclusões por dia, últimos 7 dias</p>
          </div>
        </div>

        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[...performance]} margin={{ left: -20, right: 10, top: 10 }}>
              <defs>
                <linearGradient id="fillConcluidas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#eef2f7" />
              <XAxis
                dataKey="dia"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 8px 24px -12px rgba(15,23,42,0.15)",
                }}
              />
              <Area
                type="monotone"
                dataKey="concluidas"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#fillConcluidas)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Tarefas recentes</h2>
          <Link
            to="/comerciante/minhas-tarefas"
            className="text-sm font-semibold text-blue-600 hover:underline"
          >
            Ver todas
          </Link>
        </div>
        <div className="mt-3 divide-y divide-slate-100">
          {recentTasks.length ? (
            recentTasks.map((t) => (
              <div key={t.name} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">Recompensa: {t.reward}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusCls[t.status]}`}
                >
                  {t.status}
                </span>
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-sm text-slate-400">Ainda não há tarefas criadas.</p>
          )}
        </div>
      </div>
    </ComercianteShell>
  );
}
