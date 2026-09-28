import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/kyg/AppShell";
import { AnnouncementsCarousel } from "@/components/kyg/AnnouncementsCarousel";
import { StarRating } from "@/components/kyg/StarRating";
import { StatusBadge } from "@/components/kyg/StatusBadge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/lib/auth";
import { getAppSettings } from "@/lib/wallet";
import { FileText, Send, Inbox, Ban, Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/inicio")({
  component: InicioPage,
});

function InicioPage() {
  const { user } = Route.useRouteContext();

  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: () => getMyProfile(user.id),
  });

  const { data: settings } = useQuery({
    queryKey: ["app-settings"],
    queryFn: getAppSettings,
  });
  const blocked = settings?.submissions_blocked ?? false;

  const { data: submissions } = useQuery({
    queryKey: ["submissions", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const firstName = profile?.full_name?.split(" ")[0] ?? "";

  return (
    <AppShell>
      <div className="animate-fade-up">
        <h1 className="flex items-center gap-1.5 text-2xl font-bold tracking-tight">
          Olá, {firstName || "Utilizador"}
          {(profile?.rating ?? 0) > 0 ? (
            <StarRating value={profile?.rating ?? 0} size="xs" />
          ) : null}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Acompanhe os seus serviços</p>
      </div>

      <div className="mt-6 rounded-3xl bg-primary p-6 text-primary-foreground shadow-card-lg animate-fade-up [animation-delay:100ms]">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/20">
          {blocked ? <Ban className="h-5 w-5 text-gold" /> : <Send className="h-5 w-5 text-gold" />}
        </div>
        <h2 className="mt-4 text-lg font-semibold">Enviar comprovativo</h2>
        <p className="mt-1 text-sm text-primary-foreground/70">
          {blocked
            ? "Os envios estão temporariamente bloqueados."
            : "Envie o comprovativo de um serviço realizado para análise."}
        </p>
        <Button
          asChild
          disabled={blocked}
          className="mt-5 h-11 w-full rounded-xl bg-gold font-semibold text-gold-foreground hover:bg-gold/90 disabled:pointer-events-none disabled:opacity-50"
        >
          <Link to="/enviar">Enviar comprovativo</Link>
        </Button>
      </div>

      <AnnouncementsCarousel />

      <div className="mt-8 animate-fade-up [animation-delay:200ms]">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Últimos envios</h3>
          <Link to="/envios" className="text-sm font-medium text-gold hover:underline">
            Ver todos
          </Link>
        </div>

        <div className="mt-3 space-y-3">
          {!submissions?.length ? (
            <div className="flex flex-col items-center rounded-3xl border border-dashed bg-card px-6 py-10 text-center">
              <Inbox className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-medium">Não existem comprovativos</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Você ainda não enviou nenhum comprovativo.
              </p>
            </div>
          ) : (
            submissions.map((s) => (
              <Link
                key={s.id}
                to="/envios/$id"
                params={{ id: s.id }}
                className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card transition-transform active:scale-[0.98]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{s.service}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString("pt-AO")}
                  </p>
                </div>
                <StatusBadge status={s.status} />
              </Link>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
