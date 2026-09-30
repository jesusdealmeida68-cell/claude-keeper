import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/kyg/AppShell";
import { StatusBadge } from "@/components/kyg/StatusBadge";
import { Button } from "@/components/ui/button";
import { categoryLabel, getMyTaskSubmissions, getTasksByIds, type Task } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import { ChevronRight, Coins, Inbox, ListChecks } from "lucide-react";

export const Route = createFileRoute("/_authenticated/meus-trabalhos")({
  component: MeusTrabalhosPage,
});

const filters = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Em análise" },
  { key: "approved", label: "Aprovados" },
  { key: "rejected", label: "Não aprovados" },
] as const;

function MeusTrabalhosPage() {
  const { user } = Route.useRouteContext();
  const [filter, setFilter] = useState<(typeof filters)[number]["key"]>("all");

  const { data: submissions } = useQuery({
    queryKey: ["my-task-submissions", user.id],
    queryFn: () => getMyTaskSubmissions(user.id),
  });

  const taskIds = useMemo(
    () => Array.from(new Set((submissions ?? []).map((s) => s.task_id))),
    [submissions],
  );

  const { data: tasks } = useQuery({
    queryKey: ["my-task-submissions-tasks", taskIds],
    queryFn: () => getTasksByIds(taskIds),
    enabled: taskIds.length > 0,
  });

  const taskById = useMemo(
    () => new Map((tasks ?? []).map((t) => [t.id, t] as const)),
    [tasks],
  );

  const rows = useMemo(() => {
    const sorted = [...(submissions ?? [])].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    if (filter === "all") return sorted;
    return sorted.filter((s) => s.status === filter);
  }, [submissions, filter]);

  return (
    <AppShell title="Meus trabalhos">
      <div className="flex gap-2 overflow-x-auto pb-1 animate-fade-up">
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

      <div className="mt-4 space-y-3">
        {!rows.length ? (
          <div className="flex flex-col items-center rounded-3xl border border-dashed bg-card px-6 py-12 text-center animate-fade-up">
            <Inbox className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-base font-semibold">Ainda não tens candidaturas</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Candidata-te a um trabalho e acompanha aqui o resultado.
            </p>
            <Button asChild className="mt-6 h-11 rounded-xl font-semibold">
              <Link to="/trabalhos">Procurar trabalhos</Link>
            </Button>
          </div>
        ) : (
          rows.map((s, i) => {
            const task = taskById.get(s.task_id) as Task | undefined;
            return (
              <Link
                key={s.id}
                to="/trabalhos/$id"
                params={{ id: s.task_id }}
                className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card transition-transform active:scale-[0.98] animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                  <ListChecks className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{task?.title ?? "Trabalho"}</p>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    {task ? categoryLabel[task.category] ?? task.category : null}
                    {task ? (
                      <span className="flex items-center gap-0.5 text-gold-foreground">
                        <Coins className="h-3 w-3" /> {task.reward.toLocaleString("pt-AO")} Kz
                      </span>
                    ) : null}
                  </p>
                </div>
                <StatusBadge status={s.status} />
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              </Link>
            );
          })
        )}
      </div>
    </AppShell>
  );
}
