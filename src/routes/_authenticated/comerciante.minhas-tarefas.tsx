import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ComercianteShell } from "@/components/comerciante/ComercianteShell";
import {
  formatKz,
  friendlyError,
  getMerchantSubmissions,
  getMerchantWallet,
  getMyMerchantTasks,
  setTaskActive,
  updateMerchantTask,
  type MerchantTask,
} from "@/lib/merchant";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatTaskReward } from "@/lib/tasks";
import { FileImage, Link2, ListChecks, Loader2, Pause, Pencil, Play, PlusCircle, Type } from "lucide-react";

export const Route = createFileRoute("/_authenticated/comerciante/minhas-tarefas")({
  component: ComercianteMinhasTarefasPage,
});

const statusCls: Record<string, string> = {
  Ativa: "bg-emerald-50 text-emerald-600",
  Pausada: "bg-amber-50 text-amber-600",
  Concluída: "bg-slate-100 text-slate-500",
};

const proofTypes = [
  { key: "imagem", label: "Imagem", icon: FileImage },
  { key: "texto", label: "Texto", icon: Type },
  { key: "link", label: "Link", icon: Link2 },
] as const;

function EditTaskDialog({
  task,
  userId,
  onClose,
}: {
  task: MerchantTask | null;
  userId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(task?.title ?? "");
  const [category, setCategory] = useState(task?.category ?? "outro");
  const [description, setDescription] = useState(task?.description ?? "");
  const [instructions, setInstructions] = useState((task?.instructions ?? []).join("\n"));
  const [proof, setProof] = useState<string>(task?.proof_type ?? "imagem");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!task) return;
    if (name.trim().length < 3) {
      toast.error("O nome da tarefa deve ter pelo menos 3 letras.");
      return;
    }
    if (description.trim().length < 5) {
      toast.error("A descrição deve ter pelo menos 5 letras.");
      return;
    }
    setSaving(true);
    try {
      await updateMerchantTask(task.id, {
        title: name.trim(),
        description: description.trim(),
        instructions: instructions
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
        category,
        proofType: proof,
        complexity: task.complexity,
        currency: task.currency,
      });
      await queryClient.invalidateQueries({ queryKey: ["merchant-tasks", userId] });
      await queryClient.invalidateQueries({ queryKey: ["merchant-submissions", userId] });
      toast.success("Tarefa atualizada.");
      onClose();
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!task} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-slate-900">Editar tarefa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-slate-600">Nome da tarefa</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 rounded-xl border-slate-200"
            />
          </div>
          <div>
            <Label className="text-slate-600">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1.5 rounded-xl border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="redes-sociais">Redes sociais</SelectItem>
                <SelectItem value="avaliacoes">Avaliações e reviews</SelectItem>
                <SelectItem value="downloads">Downloads de app</SelectItem>
                <SelectItem value="pesquisas">Pesquisas e questionários</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-slate-600">Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 min-h-20 rounded-xl border-slate-200"
            />
          </div>
          <div>
            <Label className="text-slate-600">Instruções passo a passo</Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="mt-1.5 min-h-28 rounded-xl border-slate-200"
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Uma instrução por linha. Links (https://...) ficam clicáveis para os participantes.
            </p>
          </div>
          <div>
            <Label className="text-slate-600">Tipo de comprovativo</Label>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {proofTypes.map((p) => {
                const Icon = p.icon;
                const active = proof === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setProof(p.key)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-semibold transition-colors",
                      active
                        ? "border-blue-500 bg-blue-50 text-blue-600"
                        : "border-slate-200 text-slate-500 hover:border-slate-300",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
            A recompensa e o número de participantes não podem ser alterados, porque o valor já foi
            reservado da tua carteira.
          </p>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar alterações"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ComercianteMinhasTarefasPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<MerchantTask | null>(null);

  const { data: wallet } = useQuery({
    queryKey: ["merchant-wallet", user.id],
    queryFn: () => getMerchantWallet(user.id),
  });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["merchant-tasks", user.id],
    queryFn: () => getMyMerchantTasks(user.id),
  });

  const { data: submissions } = useQuery({
    queryKey: ["merchant-submissions", user.id],
    queryFn: () => getMerchantSubmissions(user.id),
  });

  async function toggleActive(taskId: string, active: boolean) {
    try {
      await setTaskActive(taskId, active);
      await queryClient.invalidateQueries({ queryKey: ["merchant-tasks", user.id] });
      toast.success(active ? "Tarefa reativada." : "Tarefa pausada.");
    } catch (e) {
      toast.error(friendlyError(e));
    }
  }

  const rows = (tasks ?? []).map((t) => {
    const subs = (submissions ?? []).filter((s) => s.task_id === t.id);
    const concluidas = subs.filter((s) => s.status === "approved").length;
    const pendentes = subs.filter((s) => s.status === "pending").length;
    const status = !t.active ? "Pausada" : concluidas >= t.slots ? "Concluída" : "Ativa";
    return { ...t, concluidas, pendentes, status };
  });

  return (
    <ComercianteShell
      active="minhas-tarefas"
      title="Minhas Tarefas"
      balance={formatKz(wallet?.merchant_balance ?? 0)}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {rows.length} tarefa{rows.length === 1 ? "" : "s"} criada{rows.length === 1 ? "" : "s"}
        </p>
        <Link
          to="/comerciante/criar-tarefa"
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500"
        >
          <PlusCircle className="h-4 w-4" /> Criar tarefa
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : !rows.length ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]">
          <ListChecks className="mx-auto h-9 w-9 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-600">
            Ainda não criaste nenhuma tarefa
          </p>
          <p className="mt-1 text-xs text-slate-400">
            As tarefas que publicares vão aparecer aqui, com participantes, conclusões e estado.
          </p>
        </div>
      ) : (
        <>
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
                {rows.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-5 py-4 font-semibold text-slate-900">{t.title}</td>
                    <td className="px-5 py-4 text-slate-600">{formatTaskReward(t)}</td>
                    <td className="px-5 py-4 text-slate-600">{t.slots}</td>
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
                      <div className="flex items-center justify-end gap-4">
                        <button
                          onClick={() => setEditing(t)}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Editar
                        </button>
                        {t.status !== "Concluída" ? (
                          <button
                            onClick={() => toggleActive(t.id, !t.active)}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
                          >
                            {t.active ? (
                              <Pause className="h-3.5 w-3.5" />
                            ) : (
                              <Play className="h-3.5 w-3.5" />
                            )}
                            {t.active ? "Pausar" : "Reativar"}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cartões — mobile/tablet */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
            {rows.map((t) => (
              <div
                key={t.id}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-slate-900">{t.title}</p>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusCls[t.status]}`}
                  >
                    {t.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{formatTaskReward(t)} por participante</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-slate-50 py-2">
                    <p className="text-sm font-bold text-slate-900">{t.slots}</p>
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
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setEditing(t)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700"
                  >
                    <Pencil className="h-4 w-4" /> Editar
                  </button>
                  {t.status !== "Concluída" ? (
                    <button
                      onClick={() => toggleActive(t.id, !t.active)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700"
                    >
                      {t.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {t.active ? "Pausar" : "Reativar"}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <EditTaskDialog
        key={editing?.id ?? "closed"}
        task={editing}
        userId={user.id}
        onClose={() => setEditing(null)}
      />
    </ComercianteShell>
  );
}
