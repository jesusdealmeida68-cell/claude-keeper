import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/kyg/AppShell";
import { StarRating } from "@/components/kyg/StarRating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile, getMyRoles } from "@/lib/auth";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { getMyWithdrawals, requestWithdrawal, type WithdrawalMethod } from "@/lib/wallet";
import { downloadWithdrawalReceipt } from "@/lib/receipt";
import {
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Fingerprint,
  KeyRound,
  Loader2,
  LogOut,
  Pencil,
  Share,
  ScrollText,
  Shield,
  ShieldCheck,
  SquarePlus,
  Star,
  Wallet,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/perfil")({
  component: PerfilPage,
});

function PerfilPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<WithdrawalMethod>("phone");
  const [destination, setDestination] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [iosInstallOpen, setIosInstallOpen] = useState(false);
  const { canInstall, isIos, isStandalone, promptInstall } = useInstallPrompt();

  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: () => getMyProfile(user.id),
  });

  const { data: roles } = useQuery({
    queryKey: ["roles", user.id],
    queryFn: () => getMyRoles(user.id),
  });

  const { data: withdrawals } = useQuery({
    queryKey: ["my-withdrawals", user.id],
    queryFn: () => getMyWithdrawals(user.id),
  });

  const isAdmin = roles?.includes("admin");

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function handleInstallClick() {
    if (canInstall) {
      await promptInstall();
      return;
    }
    if (isIos) {
      setIosInstallOpen(true);
      return;
    }
    toast.info(
      'Abre o menu do teu navegador e escolhe "Instalar aplicativo" ou "Adicionar ao ecrã principal".',
    );
  }

  async function handleWithdraw() {
    const value = Number(amount.replace(",", "."));
    if (!value || value <= 0) {
      toast.error("Indica um valor válido.");
      return;
    }
    if (value > (profile?.balance ?? 0)) {
      toast.error("Saldo insuficiente.");
      return;
    }
    const dest = destination.trim();
    if (method === "phone" && !/^\d{9,15}$/.test(dest)) {
      toast.error("Indica um número de telefone válido.");
      return;
    }
    if (
      method === "iban" &&
      !/^[A-Za-z]{2}\d{2}[A-Za-z0-9]{10,30}$/.test(dest.replace(/\s/g, ""))
    ) {
      toast.error("Indica um IBAN válido.");
      return;
    }
    setWithdrawing(true);
    try {
      await requestWithdrawal(
        value,
        method,
        method === "iban" ? dest.replace(/\s/g, "").toUpperCase() : dest,
      );
      await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      await queryClient.invalidateQueries({ queryKey: ["my-withdrawals", user.id] });
      toast.success("Pedido de retirada enviado.");
      setWithdrawOpen(false);
      setAmount("");
      setDestination("");
    } catch {
      toast.error("Não foi possível pedir a retirada.");
    } finally {
      setWithdrawing(false);
    }
  }

  const initials = (profile?.full_name ?? "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const options = [
    { icon: Fingerprint, label: "Verificação de identidade", to: "/identidade" },
    { icon: Pencil, label: "Editar perfil", to: "/perfil/editar" },
    { icon: KeyRound, label: "Alterar senha", to: "/perfil/senha" },
    { icon: ScrollText, label: "Termos e condições", to: "/termos" },
    { icon: Shield, label: "Privacidade", to: "/privacidade" },
  ] as const;

  return (
    <AppShell title="Meu perfil">
      <div className="flex flex-col items-center pt-4 animate-fade-up">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-gold shadow-card-lg">
          {initials}
        </div>
        <h2 className="mt-4 flex items-center gap-1.5 text-xl font-bold tracking-tight">
          {profile?.full_name ?? "…"}
          {(profile?.rating ?? 0) > 0 ? (
            <StarRating value={profile?.rating ?? 0} size="xs" />
          ) : null}
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{profile?.phone ?? ""}</p>
      </div>

      {isAdmin ? (
        <Link
          to="/admin"
          className="mt-6 flex items-center gap-3 rounded-2xl bg-primary p-4 text-primary-foreground shadow-card animate-fade-up"
        >
          <ShieldCheck className="h-5 w-5 text-gold" />
          <span className="flex-1 text-sm font-semibold">Painel do administrador</span>
          <ChevronRight className="h-4 w-4 text-primary-foreground/60" />
        </Link>
      ) : null}

      <Link
        to="/comerciante"
        className="mt-3 flex items-center gap-3 rounded-2xl bg-slate-900 p-4 text-white shadow-card animate-fade-up"
      >
        <Briefcase className="h-5 w-5 text-blue-400" />
        <span className="flex-1 text-sm font-semibold">Área do Comerciante</span>
        <ChevronRight className="h-4 w-4 text-white/60" />
      </Link>

      <div className="mt-6 flex items-center gap-3 rounded-3xl bg-card p-5 shadow-card animate-fade-up">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold-soft text-gold-foreground">
          <Wallet className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">Saldo disponível</p>
          <p className="truncate text-lg font-bold tracking-tight">
            {(profile?.balance ?? 0).toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz
          </p>
        </div>
        <Button
          onClick={() => setWithdrawOpen(true)}
          className="h-10 shrink-0 rounded-xl bg-primary font-semibold"
        >
          Retirar
        </Button>
      </div>

      {withdrawals?.length ? (
        <div className="mt-6 animate-fade-up [animation-delay:80ms]">
          <h2 className="text-sm font-semibold text-muted-foreground">As minhas retiradas</h2>
          <div className="mt-2.5 space-y-2.5">
            {withdrawals.map((w) => (
              <div key={w.id} className="rounded-2xl bg-card p-4 shadow-card">
                <div className="flex items-center gap-3">
                  <div
                    className={
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl " +
                      (w.status === "paid"
                        ? "bg-success-soft text-success"
                        : w.status === "rejected"
                          ? "bg-destructive-soft text-destructive"
                          : "bg-warning-soft text-warning")
                    }
                  >
                    {w.status === "paid" ? (
                      <CheckCircle2 className="h-4.5 w-4.5" />
                    ) : w.status === "rejected" ? (
                      <XCircle className="h-4.5 w-4.5" />
                    ) : (
                      <Clock className="h-4.5 w-4.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      {Number(w.amount).toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {w.status === "paid"
                        ? "Paga"
                        : w.status === "rejected"
                          ? "Recusada"
                          : "Pendente"}{" "}
                      · {new Date(w.created_at).toLocaleDateString("pt-AO")}
                    </p>
                  </div>
                  {w.status === "paid" ? (
                    <button
                      onClick={() =>
                        downloadWithdrawalReceipt({
                          id: w.id,
                          full_name: profile?.full_name ?? "Utilizador",
                          phone: profile?.phone ?? "—",
                          amount: Number(w.amount),
                          method: w.method,
                          destination: w.destination,
                          created_at: w.created_at,
                          paid_at: w.paid_at,
                        })
                      }
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-primary hover:bg-secondary"
                      aria-label="Descarregar comprovativo"
                    >
                      <Download className="h-4.5 w-4.5" />
                    </button>
                  ) : null}
                </div>
                {w.status === "rejected" && w.rejection_reason ? (
                  <p className="mt-2.5 rounded-xl bg-destructive-soft p-2.5 text-xs text-destructive">
                    {w.rejection_reason}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {!isStandalone ? (
        <button
          onClick={handleInstallClick}
          className="mt-6 flex w-full items-center gap-3 rounded-3xl bg-card p-5 text-left shadow-card animate-fade-up"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold-soft text-gold-foreground">
            <Download className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Instalar aplicativo</p>
            <p className="truncate text-xs text-muted-foreground">
              Acesso mais rápido, direto do ecrã principal
            </p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
        </button>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-3xl bg-card shadow-card animate-fade-up [animation-delay:100ms]">
        {options.map((opt, i) => {
          const Icon = opt.icon;
          return (
            <Link
              key={opt.label}
              to={opt.to}
              className={`flex items-center gap-3 p-4 transition-colors hover:bg-secondary ${i > 0 ? "border-t" : ""}`}
            >
              <Icon className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium">{opt.label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            </Link>
          );
        })}
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 border-t p-4 text-left transition-colors hover:bg-destructive-soft"
        >
          <LogOut className="h-5 w-5 text-destructive" />
          <span className="flex-1 text-sm font-medium text-destructive">Sair</span>
        </button>
      </div>

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Retirar saldo</DialogTitle>
            <DialogDescription>
              Saldo disponível:{" "}
              {(profile?.balance ?? 0).toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz
            </DialogDescription>
          </DialogHeader>
          <Input
            type="number"
            inputMode="decimal"
            placeholder="Quanto queres retirar? (Kz)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-12 rounded-xl"
          />
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { value: "phone", label: "Telefone" },
                { value: "iban", label: "IBAN" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMethod(opt.value)}
                className={`h-11 rounded-xl border text-sm font-semibold transition-colors ${
                  method === opt.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:bg-secondary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Input
            placeholder={
              method === "phone"
                ? "Número de telefone para receber"
                : "IBAN para receber (ex.: AO06...)"
            }
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="h-12 rounded-xl"
            maxLength={60}
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setWithdrawOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              disabled={withdrawing || !amount || !destination.trim()}
              onClick={handleWithdraw}
              className="rounded-xl bg-primary font-semibold"
            >
              {withdrawing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar retirada"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={iosInstallOpen} onOpenChange={setIosInstallOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Instalar aplicativo</DialogTitle>
            <DialogDescription>
              No iPhone/iPad, a instalação é feita pelo Safari em 2 passos:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-2xl bg-secondary/60 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-card">
                <Share className="h-4.5 w-4.5" />
              </div>
              <p className="text-sm">
                Toca no botão <span className="font-semibold">Partilhar</span> na barra do Safari
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-secondary/60 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-card">
                <SquarePlus className="h-4.5 w-4.5" />
              </div>
              <p className="text-sm">
                Escolhe <span className="font-semibold">Adicionar ao Ecrã Principal</span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIosInstallOpen(false)}
              className="rounded-xl bg-primary font-semibold"
            >
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
