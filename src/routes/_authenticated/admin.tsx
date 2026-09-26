import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { StatusBadge } from "@/components/kyg/StatusBadge";
import { KygLogo } from "@/components/kyg/KygLogo";
import { supabase } from "@/integrations/supabase/client";
import { getMyRoles } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Files,
  LayoutDashboard,
  LogOut,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

const tabs = [
  { key: "all", label: "Comprovativos", icon: Files },
  { key: "pending", label: "Pendentes", icon: Clock },
  { key: "approved", label: "Aprovados", icon: CheckCircle2 },
  { key: "rejected", label: "Não aprovados", icon: XCircle },
] as const;

function AdminPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("all");

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles", user.id],
    queryFn: () => getMyRoles(user.id),
  });

  const isAdmin = roles?.includes("admin");

  const { data: submissions } = useQuery({
    queryKey: ["admin-submissions"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("*, profiles!submissions_user_id_fkey(full_name, phone)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (!rolesLoading && !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <p className="text-lg font-semibold">Acesso restrito</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Esta área é apenas para administradores.
        </p>
        <Link to="/inicio" className="mt-4 text-sm font-semibold text-gold hover:underline">
          Voltar ao início
        </Link>
      </div>
    );
  }

  const all = submissions ?? [];
  const counts = {
    pending: all.filter((s) => s.status === "pending").length,
    approved: all.filter((s) => s.status === "approved").length,
    rejected: all.filter((s) => s.status === "rejected").length,
    total: all.length,
  };
  const filtered = tab === "all" ? all : all.filter((s) => s.status === tab);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const stats = [
    { label: "Pendentes", value: counts.pending, icon: Clock, cls: "bg-warning-soft text-warning" },
    { label: "Aprovados", value: counts.approved, icon: CheckCircle2, cls: "bg-success-soft text-success" },
    { label: "Não aprovados", value: counts.rejected, icon: XCircle, cls: "bg-destructive-soft text-destructive" },
    { label: "Total de envios", value: counts.total, icon: Files, cls: "bg-secondary text-foreground" },
  ];

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl bg-background pb-24">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-primary px-5 py-3">
        <div className="flex items-center gap-3">
          <KygLogo size="sm" className="bg-card text-primary" />
          <h1 className="text-lg font-semibold text-primary-foreground">KYG Admin</h1>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-sm font-medium text-primary-foreground/70 hover:text-primary-foreground"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </header>

      <main className="px-5 pt-5">
        <div className="grid grid-cols-2 gap-3 animate-fade-up">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-2xl bg-card p-4 shadow-card">
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", s.cls)}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <p className="mt-3 text-2xl font-bold tracking-tight">{s.value}</p>
                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex items-center gap-2">
          <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Comprovativos recentes</h2>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                tab === t.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground shadow-card hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {!filtered.length ? (
            <div className="rounded-3xl border border-dashed bg-card px-6 py-10 text-center">
              <p className="text-sm font-medium">Não existem comprovativos</p>
            </div>
          ) : (
            filtered.map((s) => {
              const profile = s.profiles as { full_name: string; phone: string } | null;
              return (
                <div key={s.id} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{profile?.full_name ?? "Utilizador"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {profile?.phone} · {s.service} · {new Date(s.created_at).toLocaleDateString("pt-AO")}
                    </p>
                    <div className="mt-1.5">
                      <StatusBadge status={s.status} />
                    </div>
                  </div>
                  <Link
                    to="/admin/$id"
                    params={{ id: s.id }}
                    className="flex shrink-0 items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                  >
                    Ver <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
