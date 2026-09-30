import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/kyg/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  categoryLabel,
  getMyTaskSubmission,
  getTaskById,
  getTaskEvidenceUrl,
  submitTask,
} from "@/lib/tasks";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock,
  Coins,
  EyeOff,
  Flag,
  Hash,
  ImageIcon,
  ListChecks,
  Loader2,
  Tag,
  Timer,
  Users,
  X,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/trabalhos/$id")({
  component: TrabalhoDetalhePage,
});

function TrabalhoDetalhePage() {
  const { id } = Route.useParams();
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();

  const [answer, setAnswer] = useState("");
  const [evidence, setEvidence] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [sending, setSending] = useState(false);
  const [evidencePreviewUrl, setEvidencePreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleReport() {
    toast.success("Obrigado. A nossa equipa vai analisar esta tarefa.");
  }

  function handleHide() {
    toast.success("Tarefa ocultada da tua lista.");
  }

  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: ["task", id],
    queryFn: () => getTaskById(id),
  });

  const { data: submission, isLoading: subLoading } = useQuery({
    queryKey: ["my-task-submission", user.id, id],
    queryFn: () => getMyTaskSubmission(user.id, id),
  });

  async function loadEvidencePreview() {
    if (!submission?.evidence_url || evidencePreviewUrl) return;
    try {
      const url = await getTaskEvidenceUrl(submission.evidence_url);
      setEvidencePreviewUrl(url);
    } catch {
      // sem evidência disponível
    }
  }

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
      await submitTask({
        taskId: id,
        userId: user.id,
        answerText: answer.trim(),
        evidenceFile: evidence,
      });
      await queryClient.invalidateQueries({ queryKey: ["my-task-submission", user.id, id] });
      await queryClient.invalidateQueries({ queryKey: ["my-task-submissions", user.id] });
      toast.success("Tarefa enviada para análise.");
    } catch {
      toast.error("Não foi possível enviar a tarefa.");
    } finally {
      setSending(false);
    }
  }

  if (taskLoading || subLoading || !task) {
    return (
      <AppShell title="Detalhes da tarefa">
        <div className="space-y-3 animate-fade-up">
          <div className="h-40 animate-pulse rounded-3xl bg-secondary" />
          <div className="h-24 animate-pulse rounded-3xl bg-secondary" />
        </div>
      </AppShell>
    );
  }

  const status = submission?.status ?? null;

  return (
    <AppShell title="Detalhes da tarefa">
      <Link
        to="/trabalhos"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="mt-4 overflow-hidden rounded-3xl bg-card shadow-card animate-fade-up">
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
          <h1 className="text-xl font-bold leading-tight">{task.title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{task.description}</p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="flex items-center gap-1 rounded-full bg-gold-soft px-3 py-1.5 font-bold text-gold-foreground">
              <Coins className="h-3.5 w-3.5" /> {task.reward.toLocaleString("pt-AO")} Kz
            </span>
            <span className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 font-medium text-muted-foreground">
              <Timer className="h-3.5 w-3.5" /> {task.estimated_minutes} min
            </span>
            <span className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 font-medium text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> {task.slots} vagas
            </span>
          </div>

          {!status ? (
            <a
              href="#enviar"
              className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-success-soft px-4 py-3 text-success"
            >
              <span className="text-sm font-semibold">
                Terminaste a tarefa? Envia o comprovativo!
              </span>
              <span className="shrink-0 text-xs font-bold underline underline-offset-2">
                enviar agora
              </span>
            </a>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            <button
              onClick={handleReport}
              className="font-medium text-muted-foreground underline underline-offset-2"
            >
              Denunciar tarefa
            </button>
            <span className="text-muted-foreground/40">|</span>
            <button
              onClick={handleHide}
              className="flex items-center gap-1 font-medium text-muted-foreground underline underline-offset-2"
            >
              <EyeOff className="h-3 w-3" /> Ocultar tarefa
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-secondary/50 p-4">
            <div>
              <p className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                <Clock className="h-3 w-3" /> Tempo estimado
              </p>
              <p className="mt-0.5 text-sm font-bold">{task.estimated_minutes} min</p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                <Users className="h-3 w-3" /> Vagas
              </p>
              <p className="mt-0.5 text-sm font-bold">{task.slots}</p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                <Tag className="h-3 w-3" /> Categoria
              </p>
              <p className="mt-0.5 text-sm font-bold">{categoryLabel[task.category] ?? "Outro"}</p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                <Hash className="h-3 w-3" /> ID da tarefa
              </p>
              <p className="mt-0.5 text-sm font-bold uppercase">{task.id.slice(0, 8)}</p>
            </div>
          </div>

          <div className="mt-6">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <ListChecks className="h-3.5 w-3.5" /> Instruções completas
            </p>
            <ol className="mt-3 space-y-2.5">
              {task.instructions.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed">
                  <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {status === "approved" ? (
            <div className="mt-6 rounded-2xl bg-success-soft p-4 text-center">
              <p className="text-2xl font-extrabold text-success">
                +{task.reward.toLocaleString("pt-AO")} Kz
              </p>
              <p className="mt-1 text-sm font-medium text-success">
                Recompensa adicionada ao saldo.
              </p>
            </div>
          ) : status === "rejected" ? (
            <div className="mt-6 space-y-2">
              <div className="rounded-2xl bg-destructive-soft p-4">
                <p className="text-sm font-semibold text-destructive">
                  Não foi possível aprovar esta tarefa.
                </p>
                <p className="mt-1 text-xs text-destructive/80">
                  Motivo da análise: {submission?.review_note || "evidência insuficiente"}.
                </p>
              </div>
              <button
                onClick={loadEvidencePreview}
                className="text-xs font-semibold text-muted-foreground underline underline-offset-2"
              >
                Ver a minha resposta enviada
              </button>
              <div className="rounded-2xl border p-3 text-xs text-muted-foreground">
                <p>
                  <span className="font-semibold text-foreground">A tua resposta:</span>{" "}
                  {submission?.answer_text || "—"}
                </p>
                {evidencePreviewUrl ? (
                  <img
                    src={evidencePreviewUrl}
                    alt="Evidência enviada"
                    className="mt-2 max-h-56 w-full rounded-xl border object-contain"
                  />
                ) : null}
              </div>
            </div>
          ) : status === "pending" ? (
            <div className="mt-6 rounded-2xl bg-secondary/60 p-4 text-center">
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
              <div id="enviar" className="mt-6 scroll-mt-24">
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

              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Resposta da tarefa
                </p>
                <Textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Escreve sua resposta..."
                  className="mt-2 min-h-24 rounded-xl"
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
        </div>
      </div>
    </AppShell>
  );
}
