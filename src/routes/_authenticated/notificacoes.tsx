import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppShell } from "@/components/kyg/AppShell";
import { getMyNotifications, type NotificationKind } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import { AlertTriangle, Bell, CheckCircle2, Info, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/notificacoes")({
  component: NotificacoesPage,
});

const kindMeta: Record<NotificationKind, { icon: typeof Info; cls: string }> = {
  info: { icon: Info, cls: "bg-secondary text-foreground" },
  alert: { icon: AlertTriangle, cls: "bg-warning-soft text-warning" },
  success: { icon: CheckCircle2, cls: "bg-success-soft text-success" },
  error: { icon: XCircle, cls: "bg-destructive-soft text-destructive" },
};

function NotificacoesPage() {
  const { user } = Route.useRouteContext();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications", user.id],
    queryFn: () => getMyNotifications(user.id),
  });

  useEffect(() => {
    localStorage.setItem(`kyg_notif_seen_${user.id}`, new Date().toISOString());
  }, [user.id]);

  return (
    <AppShell title="Notificações">
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      ) : !notifications?.length ? (
        <div className="flex flex-col items-center rounded-3xl border border-dashed bg-card px-6 py-12 text-center animate-fade-up">
          <Bell className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-base font-semibold">Sem notificações</p>
          <p className="mt-1 text-sm text-muted-foreground">
            As atualizações dos seus envios e os avisos aparecem aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n, i) => {
            const meta =
              kindMeta[
                (n.kind as NotificationKind) in kindMeta ? (n.kind as NotificationKind) : "info"
              ];
            const Icon = meta.icon;
            return (
              <div
                key={n.id}
                className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-card animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    meta.cls,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{n.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground/70">
                    {formatDistanceToNow(new Date(n.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
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
