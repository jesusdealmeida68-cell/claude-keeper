import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/kyg/AppShell";
import { AnnouncementsCarousel } from "@/components/kyg/AnnouncementsCarousel";
import { StarRating } from "@/components/kyg/StarRating";
import { StatusBadge } from "@/components/kyg/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Award, Clock, FileText, Gem, Inbox, Medal, Trophy, Wallet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/inicio")({
  component: InicioPage,
});

const LEVELS = [
  { name: "Bronze", min: 0, next: 5, icon: Medal, cls: "bg-warning-soft text-warning" },
  { name: "Prata", min: 5, next: 15, icon: Award, cls: "bg-secondary text-foreground" },
  { name: "Ouro", min: 15, next: 30, icon: Trophy, cls: "bg-gold-soft text-gold-foreground" },
  { name: "Platina", min: 30, next: null, icon: Gem, cls: "bg-primary/10 text-primary" },
] as const;

function levelFor(approvedCount: number) {
  return [...LEVELS].reverse().find((l) => approvedCount >= l.min) ?? LEVELS[0];
}

function InicioPage() {
  const { user } = Route.useRouteContext();

  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: () => getMyProfile(user.id),
  });

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

  const { data: stats } = useQuery({
    queryKey: ["home-stats", user.id],
    queryFn: async () => {
      const { count: approved } = await supabase
        .from("submissions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "approved");
      const { count: pending } = await supabase
        .from("submissions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "pending");
      return { approved: approved ?? 0, pending: pending ?? 0 };
    },
  });

  const firstName = profile?.full_name?.split(" ")[0] ?? "";
  const approved = stats?.approved ?? 0;
  const level = levelFor(approved);
  const LevelIcon = level.icon;
  const progress = level.next ? Math.min(100, (approved / level.next) * 100) : 100;

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

      {/* Nível da conta */}
      <div className="mt-5 rounded-3xl bg-primary p-5 text-primary-foreground shadow-card-lg animate-fade-up [animation-delay:60ms]">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
              level.cls,
            )}
          >
            <LevelIcon className="h-5.5 w-5.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold tracking-tight">Nível {level.name}</p>
            <p className="text-xs text-primary-foreground/70">
              {level.next
                ? `${approved} de ${level.next} comprovativos aprovados`
                : `${approved} comprovativos aprovados · nível máximo`}
            </p>
          </div>
        </div>
        <div className="mt-3.5 h-2 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-gold transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Resumo rápido */}
      <div className="mt-3 grid grid-cols-3 gap-2.5 animate-fade-up [animation-delay:90ms]">
        <div className="rounded-2xl bg-card p-3.5 shadow-card">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-soft text-gold-foreground">
            <Wallet className="h-4 w-4" />
          </div>
          <p className="mt-2 truncate text-sm font-bold tracking-tight">
            {(profile?.balance ?? 0).toLocaleString("pt-AO", { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] text-muted-foreground">Saldo (Kz)</p>
        </div>
        <div className="rounded-2xl bg-card p-3.5 shadow-card">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-soft text-success">
            <FileText className="h-4 w-4" />
          </div>
          <p className="mt-2 text-sm font-bold tracking-tight">{approved}</p>
          <p className="text-[11px] text-muted-foreground">Aprovados</p>
        </div>
        <div className="rounded-2xl bg-card p-3.5 shadow-card">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning-soft text-warning">
            <Clock className="h-4 w-4" />
          </div>
          <p className="mt-2 text-sm font-bold tracking-tight">{stats?.pending ?? 0}</p>
          <p className="text-[11px] text-muted-foreground">Em análise</p>
        </div>
      </div>

      <AnnouncementsCarousel userId={user.id} />

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
