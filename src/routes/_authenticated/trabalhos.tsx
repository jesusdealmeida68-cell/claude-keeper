import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/kyg/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  getActiveTasks,
  getMyTaskSubmissions,
  getTaskEvidenceUrl,
  submitTask,
  type Task,
  type TaskSubmission,
} from "@/lib/tasks";
import {
  Briefcase,
  Camera,
  CheckCircle2,
  Clock,
  Coins,
  ImageIcon,
  Loader2,
  Search,
  Smartphone,
  X,
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

function TrabalhosPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
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
              Encontre tarefas disponíveis e conclua-as para receber sua recompensa.
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
      <div className="mt-5 space-y-4 pb-4">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-3xl bg-secondary" />
          ))
        ) : !visibleTasks.length ? (
          <div className="rounded-3xl border border-dashed bg-card px-6 py-12 text-center">
            <Briefcase className="mx-auto h-9 w-9 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">Nenhuma tarefa encontrada</p>
          </div>
        ) : (
          visibleTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              submission={submissionByTask.get(task.id) ?? null}
              onSubmitted={() => {
                queryClient.invalidateQueries({ queryKey: ["my-task-submissions", user.id] });
              }}
            />
          ))
        )}
      </div>
    </AppShell>
  );
}

function TaskCard({
  task,
  submission,
  onSubmitted,
}: {
  task: Task;
  submission: TaskSubmission | null;
  onSubmitted: () => void;
}) {
  const { user } = Route.useRouteContext();
  const fileRef = useRef<HTMLInputElement>(null);
  const [answer, setAnswer] = useState("");
  const [evidence, setEvidence] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [sending, setSending] = useState(false);
  const [evidencePreviewUrl, setEvidencePreviewUrl] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  async function handleSend() {
    if (!evidence) {
      toast.error("Adiciona uma imagem como evidência.");
      return;
    }
    if (!answer.trim()) {
      toast.error("Escreve a tua resposta.");
      return;
    }
    if (!confirmed) {
      toast.error("Confirma que concluíste a tarefa corretamente.");
      return;
    }
    setSending(true);
    try {
      await submitTask({ taskId: task.id, userId: user.id, answerText: answer.trim(), evidenceFile: evidence });
      toast.success("Tarefa enviada para análise.");
      onSubmitted();
    } catch {
      toast.error("Não foi possível enviar a tarefa.");
    } finally {
      setSending(false);
    }
  }

  async function loadEvidencePreview() {
    if (!submission?.evidence_url || evidencePreviewUrl) return;
    try {
      const url = await getTaskEvidenceUrl(submission.evidence_url);
      setEvidencePreviewUrl(url);
    } catch {
      // sem evidência disponível
    }
  }

  const status = submission?.status ?? null;

  return (
    <div className="overflow-hidden rounded-3xl bg-card shadow-card">
      {/* Cabeçalho de estado */}
      {status === "pending" ? (
        <div className="flex items-center gap-2 bg-warning-soft px-5 py-2.5 text-warning">
          <Clock className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wide">Em análise</span>
        </div>
      ) : status === "approved" ? (
        <div className="flex items-center gap-2 bg-success-soft px-5 py-2.5 text-success">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wide">Aprovada</span>
        </div>
      ) : status === "rejected" ? (
        <div className="flex items-center gap-2 bg-destructive-soft px-5 py-2.5 text-destructive">
          <XCircle className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wide">Não aprovada</span>
        </div>
      ) : null}

      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold-soft text-gold-foreground">
            <Smartphone className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold leading-tight">{task.title}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">{task.description}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-gold-soft px-3 py-1 font-bold text-gold-foreground">
            {task.reward.toLocaleString("pt-AO")} Kz
          </span>
          <span className="rounded-full bg-secondary px-3 py-1 font-medium text-muted-foreground">
            {task.estimated_minutes} min
          </span>
          <span className="rounded-full bg-secondary px-3 py-1 font-medium text-muted-foreground">
            {task.slots} vagas
          </span>
        </div>

        {/* ESTADO: APROVADA */}
        {status === "approved" ? (
          <div className="mt-5 rounded-2xl bg-success-soft p-4 text-center">
            <p className="text-2xl font-extrabold text-success">+{task.reward.toLocaleString("pt-AO")} Kz</p>
            <p className="mt-1 text-sm font-medium text-success">Recompensa adicionada ao saldo.</p>
          </div>
        ) : status === "rejected" ? (
          <div className="mt-5 space-y-2">
            <div className="rounded-2xl bg-destructive-soft p-4">
              <p className="text-sm font-semibold text-destructive">
                Não foi possível aprovar esta tarefa.
              </p>
              <p className="mt-1 text-xs text-destructive/80">
                Motivo da análise: {submission?.review_note || "evidência insuficiente"}.
              </p>
            </div>
            <button
              onClick={() => {
                setDetailsOpen((v) => !v);
                loadEvidencePreview();
              }}
              className="text-xs font-semibold text-muted-foreground underline underline-offset-2"
            >
              Ver detalhes
            </button>
            {detailsOpen ? (
              <div className="rounded-2xl border p-3 text-xs text-muted-foreground">
                <p>
                  <span className="font-semibold text-foreground">A tua resposta:</span>{" "}
                  {submission?.answer_text || "—"}
                </p>
                {evidencePreviewUrl ? (
                  <img
                    src={evidencePreviewUrl}
                    alt="Evidência enviada"
                    className="mt-2 max-h-48 w-full rounded-xl border object-contain"
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <>
            {/* Instruções */}
            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Instruções
              </p>
              <ol className="mt-2 space-y-1.5">
                {task.instructions.map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {status === "pending" ? (
              <div className="mt-4 rounded-2xl bg-secondary/60 p-4 text-center">
                <p className="text-sm font-medium">
                  Esta tarefa foi enviada e está aguardando análise.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Enviada em:{" "}
                  {submission ? new Date(submission.created_at).toLocaleDateString("pt-AO") : "—"}
                </p>
              </div>
            ) : (
              <>
                {/* Evidência */}
                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Evidência
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setEvidence(e.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="mt-2 flex w-full items-center gap-3 rounded-2xl border border-dashed p-3.5 text-left hover:bg-secondary/60"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-gold-foreground">
                      <Camera className="h-4.5 w-4.5" />
                    </div>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-muted-foreground">
                      {evidence ? evidence.name : "Adicionar imagem"}
                    </span>
                    {evidence ? (
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEvidence(null);
                        }}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full hover:bg-secondary"
                      >
                        <X className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                </div>

                {/* Resposta */}
                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Resposta da tarefa
                  </p>
                  <Textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Escreva sua resposta..."
                    className="mt-2 min-h-20 rounded-xl"
                  />
                </div>

                <label className="mt-4 flex items-center gap-2.5">
                  <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(!!v)} />
                  <span className="text-xs text-muted-foreground">
                    Confirmo que concluí a tarefa corretamente.
                  </span>
                </label>

                <Button
                  disabled={sending}
                  onClick={handleSend}
                  className="mt-5 h-12 w-full rounded-xl bg-gold text-sm font-bold uppercase tracking-wide text-gold-foreground hover:bg-gold/90"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar para análise"}
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
