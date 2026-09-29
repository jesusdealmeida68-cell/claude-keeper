import { createFileRoute } from "@tanstack/react-router";
import { ComercianteShell } from "@/components/comerciante/ComercianteShell";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, MessageCircle, Phone, Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/comerciante/suporte")({
  component: ComercianteSuportePage,
});

const channels = [
  { icon: MessageCircle, label: "Chat ao vivo", value: "Resposta em minutos" },
  { icon: Mail, label: "suporte@kyg.ao", value: "Resposta em 24h" },
  { icon: Phone, label: "+244 900 000 000", value: "Seg–Sex, 8h–18h" },
] as const;

function ComercianteSuportePage() {
  return (
    <ComercianteShell active="suporte" title="Suporte">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {channels.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-bold text-slate-900">{c.label}</p>
              <p className="text-xs text-slate-500">{c.value}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] sm:p-6">
        <h2 className="text-base font-bold text-slate-900">Enviar uma mensagem</h2>
        <div className="mt-4 space-y-4">
          <div>
            <Label className="text-slate-600">Assunto</Label>
            <Input
              placeholder="Ex.: Dúvida sobre orçamento de tarefas"
              className="mt-1.5 rounded-xl border-slate-200"
            />
          </div>
          <div>
            <Label className="text-slate-600">Mensagem</Label>
            <Textarea
              placeholder="Descreve a tua questão…"
              className="mt-1.5 min-h-28 rounded-xl border-slate-200"
            />
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500">
            <Send className="h-4 w-4" /> Enviar mensagem
          </button>
        </div>
      </div>
    </ComercianteShell>
  );
}
