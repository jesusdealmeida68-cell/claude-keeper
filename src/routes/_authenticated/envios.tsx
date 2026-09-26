import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/kyg/AppShell";
import { StatusBadge } from "@/components/kyg/StatusBadge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ChevronRight, FileText, Inbox } from "lucide-react";

export const Route = createFileRoute("/_authenticated/envios")({
  component: EnviosPage,
});

const filters = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Em análise" },
  { key: "approved", label: "Aprovados" },
  { key: "rejected", label: "Não aprovados" },
] as const;

function EnviosPage() {
  const { user } = Route.useRouteContext();
  const [filter, setFilter] = useState<(typeof filters)[number]["key"]>("all");

  const { data: submissions } = useQuery({
    queryKey: ["submissions", user.id, filter],
    queryFn: async () => {
      let q = supabase
        .from("submissions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  return (
    <AppShell title="Meus envios">
      <div className="flex gap-2 overflow-x-auto pb-1 animate-fade-up">
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

      <div className="mt-4 space-y-3">
        {!submissions?.length ? (
          <div className="flex flex-col items-center rounded-3xl border border-dashed bg-card px-6 py-12 text-center animate-fade-up">
            <Inbox className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-base font-semibold">Não existem comprovativos</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Você ainda não enviou nenhum comprovativo.
            </p>
            <Button
              asChild
              className="mt-6 h-11 rounded-xl bg-gold font-semibold text-gold-foreground hover:bg-gold/90"
            >
              <Link to="/enviar">Enviar comprovativo</Link>
            </Button>
          </div>
        ) : (
          submissions.map((s, i) => (
            <Link
              key={s.id}
              to="/envios/$id"
              params={{ id: s.id }}
              className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card transition-transform active:scale-[0.98] animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
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
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            </Link>
          ))
        )}
      </div>
    </AppShell>
  );
}
