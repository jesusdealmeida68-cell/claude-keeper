import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { KygLogo } from "@/components/kyg/KygLogo";
import { getMyRoles } from "@/lib/auth";
import { getAllWithdrawals } from "@/lib/wallet";
import { ArrowLeft, Wallet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/retiradas")({
  component: AdminRetiradasPage,
});

function AdminRetiradasPage() {
  const { user } = Route.useRouteContext();

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles", user.id],
    queryFn: () => getMyRoles(user.id),
  });
  const isAdmin = roles?.includes("admin");

  const { data: withdrawals, isLoading } = useQuery({
    queryKey: ["admin-withdrawals"],
    enabled: !!isAdmin,
    queryFn: getAllWithdrawals,
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

  const total = (withdrawals ?? []).reduce((sum, w) => sum + Number(w.amount), 0);

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl bg-background pb-10">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-primary px-5 py-3">
        <KygLogo size="sm" className="bg-card text-primary" />
        <h1 className="text-lg font-semibold text-primary-foreground">Retiradas</h1>
      </header>

      <main className="px-5 pt-5">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <div className="mt-4 rounded-3xl bg-primary p-5 text-primary-foreground shadow-card-lg animate-fade-up">
          <p className="text-sm text-primary-foreground/70">Total retirado</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-gold">
            {total.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz
          </p>
        </div>

        <div className="mt-5 space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-secondary" />
            ))
          ) : !withdrawals?.length ? (
            <div className="rounded-3xl border border-dashed bg-card px-6 py-10 text-center">
              <Wallet className="mx-auto h-9 w-9 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium">Ainda não existem retiradas</p>
            </div>
          ) : (
            withdrawals.map((w) => (
              <div
                key={w.id}
                className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-gold-foreground">
                  <Wallet className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {w.profile?.full_name ?? "Utilizador"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {w.profile?.phone ?? "—"} ·{" "}
                    {new Date(w.created_at).toLocaleDateString("pt-AO")}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold">
                  {Number(w.amount).toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz
                </p>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
