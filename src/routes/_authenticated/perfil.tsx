import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/kyg/AppShell";
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
import { requestWithdrawal } from "@/lib/wallet";
import {
  ChevronRight,
  KeyRound,
  Loader2,
  LogOut,
  Pencil,
  ScrollText,
  Shield,
  ShieldCheck,
  Wallet,
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
  const [withdrawing, setWithdrawing] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: () => getMyProfile(user.id),
  });

  const { data: roles } = useQuery({
    queryKey: ["roles", user.id],
    queryFn: () => getMyRoles(user.id),
  });

  const isAdmin = roles?.includes("admin");

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
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
    setWithdrawing(true);
    try {
      await requestWithdrawal(value);
      await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast.success("Pedido de retirada enviado.");
      setWithdrawOpen(false);
      setAmount("");
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
        <h2 className="mt-4 text-xl font-bold tracking-tight">{profile?.full_name ?? "…"}</h2>
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
        <Button onClick={() => setWithdrawOpen(true)} className="h-10 shrink-0 rounded-xl bg-primary font-semibold">
          Retirar
        </Button>
      </div>

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
              Saldo disponível: {(profile?.balance ?? 0).toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz
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
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setWithdrawOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              disabled={withdrawing || !amount}
              onClick={handleWithdraw}
              className="rounded-xl bg-primary font-semibold"
            >
              {withdrawing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar retirada"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
