import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/kyg/StatusBadge";
import { KygLogo } from "@/components/kyg/KygLogo";
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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { approveSubmissionWithPayment } from "@/lib/wallet";
import { ArrowLeft, Check, FileText, Loader2, MessageCircle, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/$id")({
  component: AdminAnalisePage,
});

function AdminAnalisePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [whatsOpen, setWhatsOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: s } = useQuery({
    queryKey: ["admin-submission", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("*, profiles!submissions_user_id_fkey(full_name, phone)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: signedUrl } = useQuery({
    queryKey: ["submission-file", s?.file_url],
    enabled: !!s?.file_url,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("comprovativos")
        .createSignedUrl(s!.file_url!, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });

  if (!s) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">A carregar…</p>
      </div>
    );
  }

  const profile = s.profiles as { full_name: string; phone: string } | null;
  const isPdf = s.file_name?.toLowerCase().endsWith(".pdf");

  async function reject(reviewNote: string) {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("submissions")
        .update({ status: "rejected", review_note: reviewNote })
        .eq("id", id);
      if (error) throw error;
      await queryClient.invalidateQueries();
      toast.success("Comprovativo não aprovado.");
      navigate({ to: "/admin" });
    } catch {
      toast.error("Não foi possível guardar a análise.");
    } finally {
      setLoading(false);
    }
  }

  async function approveWithPayment() {
    const amount = Number(payAmount.replace(",", "."));
    if (!amount || amount < 0) {
      toast.error("Indica um valor válido.");
      return;
    }
    setLoading(true);
    try {
      await approveSubmissionWithPayment(id, amount);
      await queryClient.invalidateQueries();
      toast.success(`Aprovado e ${amount.toLocaleString("pt-AO")} Kz depositados no saldo.`);
      navigate({ to: "/admin" });
    } catch {
      toast.error("Não foi possível aprovar e pagar.");
    } finally {
      setLoading(false);
    }
  }

  const rows: Array<[string, string | null | undefined]> = [
    ["Nome", profile?.full_name],
    ["Telefone", profile?.phone],
    ["Serviço", s.service],
    ["Data", s.service_date ? new Date(s.service_date).toLocaleDateString("pt-AO") : null],
    ["Referência", s.reference],
    ["Observação", s.note],
  ];

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl bg-background pb-10">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-primary px-5 py-3">
        <KygLogo size="sm" className="bg-card text-primary" />
        <h1 className="text-lg font-semibold text-primary-foreground">Analisar comprovativo</h1>
      </header>

      <main className="px-5 pt-5">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <div className="mt-4 rounded-3xl bg-card p-5 shadow-card animate-fade-up">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">{s.service}</h2>
            <StatusBadge status={s.status} />
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-4">
            {rows.map(([label, value]) =>
              value ? (
                <div key={label}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-medium">{value}</dd>
                </div>
              ) : null,
            )}
          </dl>
        </div>

        <div className="mt-4 overflow-hidden rounded-3xl bg-card shadow-card animate-fade-up [animation-delay:100ms]">
          {signedUrl && !isPdf ? (
            <img src={signedUrl} alt="Comprovativo" className="w-full object-contain" />
          ) : (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-medium">{s.file_name ?? "Comprovativo"}</p>
              {signedUrl ? (
                <Button asChild variant="outline" className="mt-4 rounded-xl">
                  <a href={signedUrl} target="_blank" rel="noreferrer">
                    Abrir ficheiro
                  </a>
                </Button>
              ) : null}
            </div>
          )}
        </div>

        <Button
          variant="outline"
          className="mt-4 h-12 w-full rounded-xl border-success/40 text-success hover:bg-success-soft"
          onClick={() => setWhatsOpen(true)}
        >
          <MessageCircle className="mr-2 h-5 w-5" /> Contactar no WhatsApp
        </Button>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button
            disabled={loading}
            onClick={() => setPayOpen(true)}
            className="h-12 rounded-xl bg-success font-semibold text-white hover:bg-success/90"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Check className="mr-1.5 h-5 w-5" /> Aprovar
              </>
            )}
          </Button>
          <Button
            disabled={loading}
            onClick={() => setRejectOpen(true)}
            className="h-12 rounded-xl bg-destructive font-semibold text-destructive-foreground hover:bg-destructive/90"
          >
            <X className="mr-1.5 h-5 w-5" /> Não aprovar
          </Button>
        </div>
      </main>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Motivo da não aprovação</DialogTitle>
            <DialogDescription>Explica brevemente o motivo ao utilizador.</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Ex.: comprovativo ilegível, referência inválida…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-24 rounded-xl"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              disabled={loading || !reason.trim()}
              onClick={() => reject(reason.trim())}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={whatsOpen} onOpenChange={setWhatsOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Contactar utilizador</DialogTitle>
            <DialogDescription>Vais ser encaminhado para o WhatsApp.</DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl bg-secondary p-4">
            <p className="text-sm font-semibold">{profile?.full_name ?? "Utilizador"}</p>
            <p className="text-sm text-muted-foreground">{profile?.phone ?? "—"}</p>
          </div>
          <DialogFooter>
            <Button
              className="h-12 w-full rounded-xl bg-success font-semibold text-white hover:bg-success/90"
              onClick={() => {
                const phone = (profile?.phone ?? "").replace(/\D/g, "");
                window.open(`https://wa.me/${phone}`, "_blank");
                setWhatsOpen(false);
              }}
            >
              <MessageCircle className="mr-2 h-5 w-5" /> Continuar para WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Aprovar comprovativo</DialogTitle>
            <DialogDescription>Quanto pagas a {profile?.full_name ?? "este utilizador"}?</DialogDescription>
          </DialogHeader>
          <Input
            type="number"
            inputMode="decimal"
            placeholder="Valor a pagar (Kz)"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            className="h-12 rounded-xl"
            autoFocus
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPayOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              disabled={loading || !payAmount}
              onClick={approveWithPayment}
              className="rounded-xl bg-success font-semibold text-white hover:bg-success/90"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aprovar e pagar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
