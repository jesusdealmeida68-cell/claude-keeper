import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { KygLogo } from "@/components/kyg/KygLogo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { getMyRoles } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { ArrowLeft, Copy, KeyRound, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/recuperar-senha")({
  head: () => ({ meta: [{ title: "Recuperar senha — Admin" }] }),
  component: AdminRecuperarSenhaPage,
});

type Status = "pending" | "issued" | "used";
type ResetRow = {
  id: string;
  user_id: string;
  phone: string;
  status: Status;
  created_at: string;
  issued_at: string | null;
  used_at: string | null;
  full_name: string;
  alternate_phone: string | null;
};

async function loadResets(): Promise<ResetRow[]> {
  const { data, error } = await supabase
    .from("password_resets")
    .select("id,user_id,phone,status,created_at,issued_at,used_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const ids = [...new Set((data ?? []).map((r) => r.user_id))];
  const { data: profs } = ids.length
    ? await supabase.from("profiles").select("user_id,full_name,alternate_phone").in("user_id", ids)
    : { data: [] as { user_id: string; full_name: string; alternate_phone: string | null }[] };
  const map = new Map((profs ?? []).map((p) => [p.user_id, p]));
  return (data ?? []).map((r) => ({
    ...r,
    status: r.status as Status,
    full_name: map.get(r.user_id)?.full_name ?? "—",
    alternate_phone: map.get(r.user_id)?.alternate_phone ?? null,
  }));
}

const TABS: { key: Status; label: string }[] = [
  { key: "pending", label: "Pendentes" },
  { key: "issued", label: "Código gerado" },
  { key: "used", label: "Usados" },
];

function AdminRecuperarSenhaPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Status>("pending");
  const [busy, setBusy] = useState<string | null>(null);
  const [code, setCode] = useState<{ code: string; name: string; phone: string } | null>(null);

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles", user.id],
    queryFn: () => getMyRoles(user.id),
  });
  const isAdmin = roles?.includes("admin");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-password-resets"],
    enabled: !!isAdmin,
    queryFn: loadResets,
  });

  if (!rolesLoading && !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="text-lg font-semibold">Acesso restrito</p>
        <Link to="/inicio" className="mt-4 text-sm font-semibold text-gold">
          Voltar ao início
        </Link>
      </div>
    );
  }

  async function generate(r: ResetRow) {
    setBusy(r.id);
    try {
      const { data: c, error } = await supabase.rpc("issue_password_reset_code", {
        _request_id: r.id,
      });
      if (error) throw error;
      setCode({ code: String(c), name: r.full_name, phone: r.phone });
      await qc.invalidateQueries({ queryKey: ["admin-password-resets"] });
    } catch {
      toast.error("Não foi possível gerar o código.");
    } finally {
      setBusy(null);
    }
  }

  const rows = (data ?? []).filter((r) => r.status === tab);

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl bg-background pb-10">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-primary px-5 py-3">
        <KygLogo size="sm" className="bg-card text-primary" />
        <h1 className="text-lg font-semibold text-primary-foreground">Recuperar senha</h1>
      </header>
      <main className="px-5 pt-5">
        <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <div className="mt-4 flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold",
                tab === t.key ? "bg-primary text-primary-foreground" : "bg-secondary",
              )}
            >
              {t.label} ({(data ?? []).filter((r) => r.status === t.key).length})
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          {isLoading ? (
            <div className="h-16 animate-pulse rounded-2xl bg-secondary" />
          ) : !rows.length ? (
            <div className="rounded-3xl border border-dashed bg-card px-6 py-10 text-center text-sm">
              Sem pedidos nesta aba.
            </div>
          ) : (
            rows.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-2xl bg-card p-3.5 shadow-card">
                <KeyRound className="h-5 w-5 shrink-0 text-gold" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.phone}
                    {r.alternate_phone ? ` · alt: ${r.alternate_phone}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Pedido: {new Date(r.created_at).toLocaleString("pt-AO")}
                    {r.used_at ? ` · Usado: ${new Date(r.used_at).toLocaleString("pt-AO")}` : ""}
                  </p>
                </div>
                {r.status === "pending" && (
                  <Button
                    size="sm"
                    disabled={busy === r.id}
                    onClick={() => generate(r)}
                    className="rounded-xl bg-gold text-gold-foreground"
                  >
                    {busy === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gerar código"}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </main>
      <Dialog open={!!code} onOpenChange={(o) => !o && setCode(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Código para {code?.name}</DialogTitle>
          </DialogHeader>
          <p className="text-center text-4xl font-bold tracking-[0.3em]">{code?.code}</p>
          <p className="text-center text-xs text-muted-foreground">
            Envia este código ao {code?.phone} por WhatsApp ou chamada. Não volta a ser mostrado.
          </p>
          <Button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(code?.code ?? "");
                toast.success("Código copiado.");
              } catch {
                toast.error("Não foi possível copiar.");
              }
            }}
            className="rounded-xl"
          >
            <Copy className="mr-2 h-4 w-4" /> Copiar código
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
