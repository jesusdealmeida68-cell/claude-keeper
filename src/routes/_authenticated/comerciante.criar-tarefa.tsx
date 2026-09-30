import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ComercianteShell } from "@/components/comerciante/ComercianteShell";
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
import { formatKz, friendlyError, getMerchantWallet, publishTask } from "@/lib/merchant";
import { AlertTriangle, FileImage, Link2, Loader2, Rocket, Type } from "lucide-react";

export const Route = createFileRoute("/_authenticated/comerciante/criar-tarefa")({
  component: ComercianteCriarTarefaPage,
});

const proofTypes = [
  { key: "imagem", label: "Imagem", icon: FileImage },
  { key: "texto", label: "Texto", icon: Type },
  { key: "link", label: "Link", icon: Link2 },
] as const;

function ComercianteCriarTarefaPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [proof, setProof] = useState<(typeof proofTypes)[number]["key"]>("imagem");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("redes-sociais");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [participants, setParticipants] = useState("");
  const [reward, setReward] = useState("");
  const [publishing, setPublishing] = useState(false);

  const { data: wallet } = useQuery({
    queryKey: ["merchant-wallet", user.id],
    queryFn: () => getMerchantWallet(user.id),
  });

  const total = Number(participants || 0) * Number(reward || 0);
  const merchantBalance = wallet?.merchant_balance ?? 0;
  const hasEnough = total > 0 && total <= merchantBalance;

  async function handlePublish() {
    if (!name.trim() || name.trim().length < 3) {
      toast.error("Dá um nome à tarefa (pelo menos 3 letras).");
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      toast.error("Escreve uma descrição (pelo menos 5 letras).");
      return;
    }
    if (!(Number(reward) >= 10)) {
      toast.error("A recompensa mínima por tarefa é 10 Kz.");
      return;
    }
    if (!(Number(participants) >= 1)) {
      toast.error("Indica pelo menos 1 participante.");
      return;
    }
    if (total > merchantBalance) {
      toast.error("Saldo da carteira insuficiente para publicar esta tarefa.");
      return;
    }
    setPublishing(true);
    try {
      await publishTask({
        title: name.trim(),
        description: description.trim(),
        instructions: instructions
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
        reward: Number(reward),
        slots: Number(participants),
        category,
        proofType: proof,
      });
      await queryClient.invalidateQueries({ queryKey: ["merchant-wallet", user.id] });
      await queryClient.invalidateQueries({ queryKey: ["merchant-tasks", user.id] });
      toast.success(`Tarefa "${name.trim()}" publicada com sucesso.`);
      navigate({ to: "/comerciante/minhas-tarefas" });
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setPublishing(false);
    }
  }

  return (
    <ComercianteShell
      active="criar-tarefa"
      title="Criar Tarefa"
      balance={formatKz(merchantBalance)}
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] sm:p-6">
            <h2 className="text-base font-bold text-slate-900">Detalhes da tarefa</h2>
            <div className="mt-4 space-y-4">
              <div>
                <Label className="text-slate-600">Nome da tarefa</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: Seguir a nossa página no Instagram"
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
                  placeholder="Explica em poucas linhas o que é esta tarefa."
                  className="mt-1.5 min-h-20 rounded-xl border-slate-200"
                />
              </div>
              <div>
                <Label className="text-slate-600">Instruções passo a passo</Label>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder={
                    "Abre o link da página\nToca em Seguir\nEnvia o print como comprovativo"
                  }
                  className="mt-1.5 min-h-28 rounded-xl border-slate-200"
                />
                <p className="mt-1.5 text-xs text-slate-400">Uma instrução por linha.</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] sm:p-6">
            <h2 className="text-base font-bold text-slate-900">Orçamento e participantes</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-slate-600">Quantidade de participantes</Label>
                <Input
                  type="number"
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  placeholder="Ex.: 100"
                  className="mt-1.5 rounded-xl border-slate-200"
                />
              </div>
              <div>
                <Label className="text-slate-600">Valor da recompensa por tarefa (Kz)</Label>
                <Input
                  type="number"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                  placeholder="Ex.: 150"
                  className="mt-1.5 rounded-xl border-slate-200"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] sm:p-6">
            <h2 className="text-base font-bold text-slate-900">Tipo de comprovativo exigido</h2>
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {proofTypes.map((p) => {
                const Icon = p.icon;
                const active = proof === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setProof(p.key)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border py-4 text-sm font-semibold transition-colors",
                      active
                        ? "border-blue-500 bg-blue-50 text-blue-600"
                        : "border-slate-200 text-slate-500 hover:border-slate-300",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Resumo */}
        <div className="xl:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] sm:p-6">
            <h2 className="text-base font-bold text-slate-900">Resumo do orçamento</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Participantes</span>
                <span className="font-semibold text-slate-900">{participants || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Recompensa por tarefa</span>
                <span className="font-semibold text-slate-900">{reward || 0} Kz</span>
              </div>
              <div className="h-px bg-slate-100" />
              <div className="flex items-center justify-between text-base">
                <span className="font-semibold text-slate-900">Orçamento total</span>
                <span
                  className={cn(
                    "font-bold",
                    hasEnough || total === 0 ? "text-blue-600" : "text-rose-600",
                  )}
                >
                  {total.toLocaleString("pt-AO")} Kz
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Saldo na carteira</span>
                <span>{formatKz(merchantBalance)}</span>
              </div>
            </div>

            {total > merchantBalance ? (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-600">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                Saldo insuficiente para este orçamento. Adiciona fundos na Carteira antes de
                publicar.
              </div>
            ) : null}

            <button
              type="button"
              disabled={publishing || total > merchantBalance}
              onClick={handlePublish}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {publishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Rocket className="h-4 w-4" /> Publicar tarefa
                </>
              )}
            </button>
            <p className="mt-2.5 text-center text-xs text-slate-400">
              O valor será reservado da tua carteira ao publicar.
            </p>
          </div>
        </div>
      </div>
    </ComercianteShell>
  );
}
