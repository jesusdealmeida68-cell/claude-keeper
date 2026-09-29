import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
import { FileImage, Link2, Rocket, Type } from "lucide-react";

export const Route = createFileRoute("/_authenticated/comerciante/criar-tarefa")({
  component: ComercianteCriarTarefaPage,
});

const proofTypes = [
  { key: "imagem", label: "Imagem", icon: FileImage },
  { key: "texto", label: "Texto", icon: Type },
  { key: "link", label: "Link", icon: Link2 },
] as const;

function ComercianteCriarTarefaPage() {
  const [proof, setProof] = useState<(typeof proofTypes)[number]["key"]>("imagem");
  const [participants, setParticipants] = useState("100");
  const [reward, setReward] = useState("150");

  const total = (Number(participants || 0) * Number(reward || 0)).toLocaleString("pt-AO");

  return (
    <ComercianteShell active="criar-tarefa" title="Criar Tarefa">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] sm:p-6">
            <h2 className="text-base font-bold text-slate-900">Detalhes da tarefa</h2>
            <div className="mt-4 space-y-4">
              <div>
                <Label className="text-slate-600">Nome da tarefa</Label>
                <Input
                  placeholder="Ex.: Seguir a nossa página no Instagram"
                  className="mt-1.5 rounded-xl border-slate-200"
                />
              </div>
              <div>
                <Label className="text-slate-600">Categoria</Label>
                <Select defaultValue="redes-sociais">
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
                  placeholder="Explica em poucas linhas o que é esta tarefa."
                  className="mt-1.5 min-h-20 rounded-xl border-slate-200"
                />
              </div>
              <div>
                <Label className="text-slate-600">Instruções passo a passo</Label>
                <Textarea
                  placeholder={
                    "1. Abre o link da página\n2. Toca em Seguir\n3. Envia o print como comprovativo"
                  }
                  className="mt-1.5 min-h-28 rounded-xl border-slate-200"
                />
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
                  className="mt-1.5 rounded-xl border-slate-200"
                />
              </div>
              <div>
                <Label className="text-slate-600">Valor da recompensa por tarefa (Kz)</Label>
                <Input
                  type="number"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
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
                <span className="font-bold text-blue-600">{total} Kz</span>
              </div>
            </div>

            <button
              type="button"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-500"
            >
              <Rocket className="h-4 w-4" /> Publicar tarefa
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
