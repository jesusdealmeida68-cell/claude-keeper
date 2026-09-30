import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
import {
  formatKz,
  getMerchantSubmissions,
  getMerchantWallet,
  getMyMerchantTasks,
} from "@/lib/merchant";
import { CheckCircle2, Clock3, ListChecks, Wallet2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/comerciante/")({
  component: ComercianteVisaoGeralPage,
});

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const statusCls: Record<string, string> = {
  Ativa: "bg-emerald-50 text-emerald-600",
  Pausada: "bg-amber-50 text-amber-600",
  Concluída: "bg-slate-100 text-slate-500",
};

function ComercianteVisaoGeralPage() {
  const { user } = Route.useRouteContext();

  const { data: wallet } = useQuery({
    queryKey: ["merchant-wallet", user.id],
    queryFn: () => getMerchantWallet(user.id),
  });

  const { data: tasks } = useQuery({
    queryKey: ["merchant-tasks", user.id],
    queryFn: () => getMyMerchantTasks(user.id),
  });

  const { data: submissions } = useQuery({
    queryKey: ["merchant-submissions", user.id],
    queryFn: () => getMerchantSubmissions(user.id),
  });

  const approvedByTask = new Map<string, number>();
  for (const s of submissions ?? []) {
    if (s.status === "approved")
      approvedByTask.set(s.task_id, (approvedByTask.get(s.task_id) ?? 0) + 1);
  }

  const activas = (tasks ?? []).filter((t) => t.active).length;
  const pendentes = (submissions ?? []).filter((s) => s.status === "pending").length;
  const concluidas = (submissions ?? []).filter((s) => s.status === "approved").length;

  const performance = DIAS.map((dia) => ({ dia, concluidas: 0 }));
  for (const s of submissions ?? []) {
    if (s.status !== "approved") continue;
    const idx = new Date(s.created_at).getDay();
    const bucket = performance[idx];
    if (bucket) bucket.concluidas += 1;
  }

  const cards = [
    {
      label: "Saldo disponível",
      value: formatKz(wallet?.merchant_balance ?? 0),
      icon: Wallet2,
      accent: "from-blue-500 to-blue-600",
    },
    {
      label: "Tarefas ativas",
      value: String(activas),
      icon: ListChecks,
      accent: "from-slate-700 to-slate-900",
    },
    {
      label: "Tarefas concluídas",
      value: String(concluidas),
      icon: CheckCircle2,
      accent: "from-emerald-500 to-emerald-600",
    },
    {
      label: "Pendentes de aprovação",
      value: String(pendentes),
      icon: Clock3,
      accent: "from-amber-500 to-amber-600",
    },
  ] as const;

  const recentTasks = (tasks ?? []).slice(0, 5).map((t) => {
    const done = approvedByTask.get(t.id) ?? 0;
    const status = !t.active ? "Pausada" : done >= t.slots ? "Concluída" : "Ativa";
    return { name: t.title, reward: formatKz(t.reward), status };
  });

  return (
    <ComercianteShell
      active="visao-geral"
      title="Visão Geral"
      balance={formatKz(wallet?.merchant_balance ?? 0)}
    >
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
        <div>
          <h2 className="text-base font-bold text-slate-900">Desempenho das tarefas</h2>
          <p className="text-sm text-slate-500">Conclusões aprovadas por dia da semana</p>
        </div>

        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={performance} margin={{ left: -20, right: 10, top: 10 }}>
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
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
              />
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
