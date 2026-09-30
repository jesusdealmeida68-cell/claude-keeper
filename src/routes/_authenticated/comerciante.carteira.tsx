import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ComercianteShell } from "@/components/comerciante/ComercianteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  UNITEL_MONEY,
  createDeposit,
  formatKz,
  friendlyError,
  getMerchantWallet,
  getMyDeposits,
  getMyTransactions,
  transferToMerchant,
} from "@/lib/merchant";
import {
  ArrowDownCircle,
  ArrowLeftRight,
  ArrowUpCircle,
  Clock3,
  CloudUpload,
  Loader2,
  PlusCircle,
  Smartphone,
  Wallet2,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/comerciante/carteira")({
  component: ComercianteCarteiraPage,
});

const kindLabel: Record<string, string> = {
  transfer: "Transferência do saldo",
  publish: "Publicação de tarefa",
  deposit: "Depósito via Unitel Money",
};

function ComercianteCarteiraPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"transferir" | "unitel">("transferir");
  const [transferAmount, setTransferAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: wallet } = useQuery({
    queryKey: ["merchant-wallet", user.id],
    queryFn: () => getMerchantWallet(user.id),
  });

  const { data: transactions } = useQuery({
    queryKey: ["merchant-transactions", user.id],
    queryFn: () => getMyTransactions(user.id),
  });

  const { data: deposits } = useQuery({
    queryKey: ["merchant-deposits", user.id],
    queryFn: () => getMyDeposits(user.id),
  });

  async function refreshAll() {
    await queryClient.invalidateQueries({ queryKey: ["merchant-wallet", user.id] });
    await queryClient.invalidateQueries({ queryKey: ["merchant-transactions", user.id] });
    await queryClient.invalidateQueries({ queryKey: ["merchant-deposits", user.id] });
    await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
  }

  async function handleTransfer() {
    const amount = Number(transferAmount);
    if (!(amount > 0)) {
      toast.error("Indica um valor válido.");
      return;
    }
    if (amount > (wallet?.balance ?? 0)) {
      toast.error("Não tens esse saldo disponível na tua conta normal.");
      return;
    }
    setBusy(true);
    try {
      await transferToMerchant(amount);
      await refreshAll();
      toast.success(`${formatKz(amount)} transferidos para a carteira de comerciante.`);
      setTransferAmount("");
      setOpen(false);
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleDeposit() {
    const amount = Number(depositAmount);
    if (!(amount > 0)) {
      toast.error("Indica um valor válido.");
      return;
    }
    if (!file) {
      toast.error("Anexa o comprovativo do depósito.");
      return;
    }
    setBusy(true);
    try {
      await createDeposit(user.id, amount, file);
      await refreshAll();
      toast.success("Comprovativo enviado. Aguarda a aprovação do admin.");
      setDepositAmount("");
      setFile(null);
      setOpen(false);
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  const pendingDeposits = (deposits ?? []).filter((d) => d.status === "pending");

  return (
    <ComercianteShell
      active="carteira"
      title="Carteira"
      balance={formatKz(wallet?.merchant_balance ?? 0)}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 p-6 text-white shadow-lg shadow-slate-900/20">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
            <Wallet2 className="h-5 w-5" />
          </div>
          <p className="mt-4 text-3xl font-bold tracking-tight">
            {formatKz(wallet?.merchant_balance ?? 0)}
          </p>
          <p className="mt-1 text-sm text-slate-400">Saldo disponível (comerciante)</p>
          <button
            onClick={() => setOpen(true)}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-2.5 text-sm font-bold text-white hover:bg-blue-400"
          >
            <PlusCircle className="h-4 w-4" /> Adicionar fundos
          </button>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <ArrowLeftRight className="h-5 w-5" />
          </div>
          <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            {formatKz(wallet?.balance ?? 0)}
          </p>
          <p className="mt-1 text-sm text-slate-500">Saldo da tua conta normal</p>
          <p className="mt-5 text-xs text-slate-400">
            Podes transferir este saldo diretamente para a carteira de comerciante, sem esperar
            aprovação.
          </p>
        </div>
      </div>

      {pendingDeposits.length ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
            <Clock3 className="h-4 w-4" /> {pendingDeposits.length} depósito(s) a aguardar aprovação
          </div>
          <p className="mt-1 text-xs text-amber-600">
            O saldo entra na carteira assim que o admin confirmar o comprovativo.
          </p>
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] sm:p-6">
        <h2 className="text-base font-bold text-slate-900">Histórico de transações</h2>
        <div className="mt-3 divide-y divide-slate-100">
          {!transactions?.length ? (
            <p className="py-6 text-center text-sm text-slate-400">Ainda não há transações.</p>
          ) : (
            transactions.map((t) => {
              const positive = t.amount > 0;
              return (
                <div key={t.id} className="flex items-center gap-3 py-3.5">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      positive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {positive ? (
                      <ArrowDownCircle className="h-4.5 w-4.5" />
                    ) : (
                      <ArrowUpCircle className="h-4.5 w-4.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {kindLabel[t.kind] ?? t.description}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(t.created_at).toLocaleString("pt-AO")}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 text-sm font-bold ${positive ? "text-emerald-600" : "text-slate-700"}`}
                  >
                    {positive ? "+" : ""}
                    {formatKz(t.amount)}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {deposits?.length ? (
        <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] sm:p-6">
          <h2 className="text-base font-bold text-slate-900">Depósitos via Unitel Money</h2>
          <div className="mt-3 divide-y divide-slate-100">
            {deposits.map((d) => (
              <div key={d.id} className="flex items-center gap-3 py-3">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    d.status === "approved"
                      ? "bg-emerald-50 text-emerald-600"
                      : d.status === "rejected"
                        ? "bg-rose-50 text-rose-600"
                        : "bg-amber-50 text-amber-600",
                  )}
                >
                  {d.status === "approved" ? (
                    <ArrowDownCircle className="h-4.5 w-4.5" />
                  ) : d.status === "rejected" ? (
                    <XCircle className="h-4.5 w-4.5" />
                  ) : (
                    <Clock3 className="h-4.5 w-4.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{formatKz(d.amount)}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(d.created_at).toLocaleDateString("pt-AO")}
                  </p>
                  {d.status === "rejected" && d.rejection_reason ? (
                    <p className="mt-1 text-xs text-rose-600">{d.rejection_reason}</p>
                  ) : null}
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    d.status === "approved"
                      ? "bg-emerald-50 text-emerald-600"
                      : d.status === "rejected"
                        ? "bg-rose-50 text-rose-600"
                        : "bg-amber-50 text-amber-600",
                  )}
                >
                  {d.status === "approved"
                    ? "Aprovado"
                    : d.status === "rejected"
                      ? "Recusado"
                      : "Pendente"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Adicionar fundos */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Adicionar fundos</DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setTab("transferir")}
              className={cn(
                "flex-1 rounded-lg py-2 text-sm font-semibold transition-colors",
                tab === "transferir" ? "bg-white text-slate-900 shadow" : "text-slate-500",
              )}
            >
              Da minha conta
            </button>
            <button
              onClick={() => setTab("unitel")}
              className={cn(
                "flex-1 rounded-lg py-2 text-sm font-semibold transition-colors",
                tab === "unitel" ? "bg-white text-slate-900 shadow" : "text-slate-500",
              )}
            >
              Unitel Money
            </button>
          </div>

          {tab === "transferir" ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                Saldo disponível na tua conta normal:{" "}
                <span className="font-semibold text-slate-900">
                  {formatKz(wallet?.balance ?? 0)}
                </span>
              </p>
              <div>
                <Label className="text-slate-600">Valor a transferir (Kz)</Label>
                <Input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="Ex.: 20000"
                  className="mt-1.5 rounded-xl border-slate-200"
                />
              </div>
              <Button
                disabled={busy}
                onClick={handleTransfer}
                className="h-11 w-full rounded-xl bg-blue-600 font-semibold hover:bg-blue-500"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Transferir para a carteira"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-xl bg-blue-50 p-3.5">
                <Smartphone className="mt-0.5 h-4.5 w-4.5 shrink-0 text-blue-600" />
                <div className="text-sm text-blue-700">
                  <p>
                    Envia via <span className="font-semibold">Unitel Money</span> para o número{" "}
                    <span className="font-semibold">{UNITEL_MONEY.phone}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-blue-600">Código: {UNITEL_MONEY.code}</p>
                </div>
              </div>
              <div>
                <Label className="text-slate-600">Valor depositado (Kz)</Label>
                <Input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Ex.: 20000"
                  className="mt-1.5 rounded-xl border-slate-200"
                />
              </div>
              <div>
                <Label className="text-slate-600">Comprovativo</Label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-4 text-sm font-medium text-slate-500 hover:border-blue-400 hover:text-blue-600"
                >
                  <CloudUpload className="h-4.5 w-4.5" />
                  {file ? file.name : "Anexar print ou PDF do pagamento"}
                </button>
              </div>
              <Button
                disabled={busy}
                onClick={handleDeposit}
                className="h-11 w-full rounded-xl bg-blue-600 font-semibold hover:bg-blue-500"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar comprovativo"}
              </Button>
              <p className="text-center text-xs text-slate-400">
                O saldo entra na carteira depois de o admin aprovar o comprovativo.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ComercianteShell>
  );
}
