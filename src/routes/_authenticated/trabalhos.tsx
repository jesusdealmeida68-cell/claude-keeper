import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/kyg/AppShell";
import { cn } from "@/lib/utils";
import { getActiveTasks, getMyTaskSubmissions, type TaskSubmission } from "@/lib/tasks";
import {
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  Search,
  Smartphone,
  Timer,
  Users,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/trabalhos")({
  component: TrabalhosPage,
});

const filters = [
  { key: "todas", label: "Todas" },
  { key: "novas", label: "Novas" },
  { key: "simples", label: "Mais simples" },
  { key: "pagas", label: "Mais bem pagas" },
] as const;

const statusMeta: Record<
  TaskSubmission["status"],
  { label: string; icon: typeof Clock; cls: string }
> = {
  pending: { label: "Em análise", icon: Clock, cls: "bg-warning-soft text-warning" },
  approved: { label: "Aprovada", icon: CheckCircle2, cls: "bg-success-soft text-success" },
  rejected: { label: "Não aprovada", icon: XCircle, cls: "bg-destructive-soft text-destructive" },
};

function TrabalhosPage() {
  const { user } = Route.useRouteContext();
  const [filter, setFilter] = useState<(typeof filters)[number]["key"]>("todas");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: getActiveTasks,
  });

  const { data: submissions, isLoading: subsLoading } = useQuery({
    queryKey: ["my-task-submissions", user.id],
    queryFn: () => getMyTaskSubmissions(user.id),
  });

  const submissionByTask = useMemo(() => {
    const map = new Map<string, TaskSubmission>();
    (submissions ?? []).forEach((s) => map.set(s.task_id, s));
    return map;
  }, [submissions]);

  const summary = useMemo(() => {
    const list = tasks ?? [];
    const subs = submissions ?? [];
    const pending = subs.filter((s) => s.status === "pending").length;
    const approved = subs.filter((s) => s.status === "approved").length;
    const earned = subs
      .filter((s) => s.status === "approved")
      .reduce((sum, s) => {
        const t = list.find((tk) => tk.id === s.task_id);
        return sum + (t?.reward ?? 0);
      }, 0);
    const available = list.filter((t) => !submissionByTask.has(t.id)).length;
    return { available, pending, approved, earned };
  }, [tasks, submissions, submissionByTask]);

  const visibleTasks = useMemo(() => {
    let list = [...(tasks ?? [])];
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
      );
    }
    if (filter === "novas") {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (filter === "simples") {
      list.sort((a, b) => a.estimated_minutes - b.estimated_minutes);
    } else if (filter === "pagas") {
      list.sort((a, b) => b.reward - a.reward);
    }
    return list;
  }, [tasks, filter, query]);

  const loading = tasksLoading || subsLoading;

  return (
    <AppShell title="Trabalhos">
      <div className="animate-fade-up">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Trabalhos</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Toca numa tarefa para ver todos os detalhes e enviar.
            </p>
          </div>
          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Pesquisar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-card text-foreground shadow-card"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>

        {searchOpen ? (
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar tarefas..."
            className="mt-3 h-11 w-full rounded-xl border bg-card px-4 text-sm outline-none focus:ring-2 focus:ring-gold"
          />
        ) : null}
      </div>

      {/* Painel de resumo */}
      <div className="mt-5 grid grid-cols-2 gap-3 animate-fade-up [animation-delay:50ms]">
        <div className="rounded-3xl bg-primary p-4 text-primary-foreground shadow-card-lg">
          <p className="text-xs text-primary-foreground/70">Disponíveis</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{summary.available}</p>
        </div>
        <div className="rounded-3xl bg-card p-4 shadow-card">
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> Em análise
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-warning">{summary.pending}</p>
        </div>
        <div className="rounded-3xl bg-card p-4 shadow-card">
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5" /> Concluídas
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-success">{summary.approved}</p>
        </div>
        <div className="rounded-3xl bg-gold-soft p-4">
          <p className="flex items-center gap-1 text-xs text-gold-foreground/70">
            <Coins className="h-3.5 w-3.5" /> Ganho
          </p>
          <p className="mt-1 text-lg font-bold tracking-tight text-gold-foreground">
            {summary.earned.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground shadow-card hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de tarefas */}
      <div className="mt-5 space-y-3 pb-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-3xl bg-secondary" />
          ))
        ) : !visibleTasks.length ? (
          <div className="rounded-3xl border border-dashed bg-card px-6 py-12 text-center">
            <Briefcase className="mx-auto h-9 w-9 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">Nenhuma tarefa encontrada</p>
          </div>
        ) : (
          visibleTasks.map((task) => {
            const submission = submissionByTask.get(task.id);
            const meta = submission ? statusMeta[submission.status] : null;
            const StatusIcon = meta?.icon;
            return (
              <Link
                key={task.id}
                to="/trabalhos/$id"
                params={{ id: task.id }}
                className="flex items-center gap-3 rounded-3xl bg-card p-4 shadow-card transition-transform active:scale-[0.99]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold-soft text-gold-foreground">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{task.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {task.description}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="flex items-center gap-1 rounded-full bg-gold-soft px-2.5 py-1 font-bold text-gold-foreground">
                      <Coins className="h-3 w-3" /> {task.reward.toLocaleString("pt-AO")} Kz
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 font-medium text-muted-foreground">
                      <Timer className="h-3 w-3" /> {task.estimated_minutes} min
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 font-medium text-muted-foreground">
                      <Users className="h-3 w-3" /> {task.slots}
                    </span>
                    {meta && StatusIcon ? (
                      <span
                        className={cn(
                          "flex items-center gap-1 rounded-full px-2.5 py-1 font-bold",
                          meta.cls,
                        )}
                      >
                        <StatusIcon className="h-3 w-3" /> {meta.label}
                      </span>
                    ) : null}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              </Link>
            );
          })
        )}
      </div>
    </AppShell>
  );
}
