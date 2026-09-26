import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/kyg/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Bell, CheckCircle2, Clock, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/notificacoes")({
  component: NotificacoesPage,
});

const meta = {
  pending: { icon: Clock, title: "Comprovativo em análise", desc: "O seu comprovativo está em análise.", cls: "bg-warning-soft text-warning" },
  approved: { icon: CheckCircle2, title: "Comprovativo aprovado", desc: "O seu comprovativo foi aprovado.", cls: "bg-success-soft text-success" },
  rejected: { icon: XCircle, title: "Comprovativo não aprovado", desc: "O seu comprovativo não foi aprovado.", cls: "bg-destructive-soft text-destructive" },
} as const;

function NotificacoesPage() {
  const { user } = Route.useRouteContext();

  const { data: submissions } = useQuery({
    queryKey: ["submissions", user.id, "notif"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  return (
    <AppShell title="Notificações">
      {!submissions?.length ? (
        <div className="flex flex-col items-center rounded-3xl border border-dashed bg-card px-6 py-12 text-center animate-fade-up">
          <Bell className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-base font-semibold">Sem notificações</p>
          <p className="mt-1 text-sm text-muted-foreground">
            As atualizações dos seus envios aparecem aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((s, i) => {
            const m = meta[(s.status as keyof typeof meta) in meta ? (s.status as keyof typeof meta) : "pending"];
            const Icon = m.icon;
            return (
              <div
                key={s.id}
                className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-card animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${m.cls}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{m.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {m.desc} — {s.service}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground/70">
                    {new Date(s.created_at).toLocaleString("pt-AO")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
