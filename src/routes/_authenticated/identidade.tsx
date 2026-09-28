import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/kyg/AppShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  createIdentityVerification,
  getMyLatestVerification,
  uploadIdentityFile,
} from "@/lib/identity";
import { cn } from "@/lib/utils";
import {
  Camera,
  Check,
  CheckCircle2,
  Clock,
  IdCard,
  ImagePlus,
  Loader2,
  Shield,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/identidade")({
  component: IdentidadePage,
});

const steps = [
  { n: 1, label: "Documento" },
  { n: 2, label: "Selfie" },
  { n: 3, label: "Enviar" },
] as const;

function ProgressSteps({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors",
                current > s.n
                  ? "bg-success text-white"
                  : current === s.n
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground",
              )}
            >
              {current > s.n ? <Check className="h-4 w-4" /> : s.n}
            </div>
            <span
              className={cn(
                "text-[10px] font-medium",
                current === s.n ? "text-primary" : "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 ? (
            <div
              className={cn(
                "mb-4 h-0.5 w-8 rounded-full transition-colors",
                current > s.n ? "bg-success" : "bg-secondary",
              )}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function UploadBox({
  label,
  preview,
  onPick,
  onClear,
  compact,
}: {
  label: string;
  preview: string | null;
  onPick: (file: File) => void;
  onClear: () => void;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
      {preview ? (
        <div className="relative overflow-hidden rounded-2xl border-2 border-success/40">
          <img
            src={preview}
            alt={label}
            className={cn("w-full object-cover", compact ? "h-28" : "h-36")}
          />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
            <span className="flex items-center gap-1 text-xs font-semibold text-white">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" /> {label}
            </span>
            <button
              type="button"
              onClick={onClear}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-foreground"
              aria-label={`Remover ${label}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/25 bg-primary/5 text-primary transition-colors hover:bg-primary/10",
            compact ? "h-28" : "h-36",
          )}
        >
          <ImagePlus className="h-6 w-6" />
          <span className="text-xs font-semibold">{label}</span>
        </button>
      )}
    </div>
  );
}

function SecurityNote() {
  return (
    <div className="mt-6 flex items-start gap-3 rounded-2xl bg-secondary/60 p-4">
      <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <p className="text-xs leading-relaxed text-muted-foreground">
        Os seus documentos são utilizados exclusivamente para a verificação de identidade e são
        protegidos de forma segura.
      </p>
    </div>
  );
}

function IdentidadePage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();

  const { data: latest, isLoading } = useQuery({
    queryKey: ["identity-verification", user.id],
    queryFn: () => getMyLatestVerification(user.id),
  });

  const [restart, setRestart] = useState(false);
  const [step, setStep] = useState(1);
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setStep(1);
    setFront(null);
    setBack(null);
    setSelfie(null);
    setFrontPreview(null);
    setBackPreview(null);
    setSelfiePreview(null);
    setConfirmed(false);
  }

  async function handleSubmit() {
    if (!front || !back || !selfie) return;
    setSubmitting(true);
    try {
      const [frontUrl, backUrl, selfieUrl] = await Promise.all([
        uploadIdentityFile(user.id, front, "front"),
        uploadIdentityFile(user.id, back, "back"),
        uploadIdentityFile(user.id, selfie, "selfie"),
      ]);
      await createIdentityVerification({
        user_id: user.id,
        front_url: frontUrl,
        back_url: backUrl,
        selfie_url: selfieUrl,
      });
      await queryClient.invalidateQueries({ queryKey: ["identity-verification", user.id] });
      reset();
      setRestart(false);
      toast.success("Documentos enviados para verificação!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível enviar. Tenta de novo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <AppShell title="Verificação de identidade">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  const showStatusScreen = latest && latest.status !== "rejected" && !restart;
  const showRejectedScreen = latest && latest.status === "rejected" && !restart;

  if (showStatusScreen) {
    const approved = latest!.status === "approved";
    return (
      <AppShell title="Verificação de identidade">
        <div className="flex flex-col items-center pt-10 text-center animate-fade-up">
          <div
            className={cn(
              "flex h-20 w-20 items-center justify-center rounded-full",
              approved ? "bg-success-soft text-success" : "bg-warning-soft text-warning",
            )}
          >
            {approved ? (
              <CheckCircle2 className="h-10 w-10" />
            ) : (
              <Clock className="h-10 w-10" />
            )}
          </div>
          <h2 className="mt-5 text-xl font-bold tracking-tight">
            {approved ? "Aprovado ✓" : "Verificação em análise ⏳"}
          </h2>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            {approved
              ? "A sua identidade foi confirmada com sucesso."
              : "Os seus documentos foram enviados com sucesso. A nossa equipa irá analisar as informações e notificá-lo quando houver uma decisão."}
          </p>
        </div>
        <SecurityNote />
      </AppShell>
    );
  }

  if (showRejectedScreen) {
    return (
      <AppShell title="Verificação de identidade">
        <div className="flex flex-col items-center pt-10 text-center animate-fade-up">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive-soft text-destructive">
            <XCircle className="h-10 w-10" />
          </div>
          <h2 className="mt-5 text-xl font-bold tracking-tight">Não aprovado ✕</h2>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            {latest!.rejection_reason ||
              "Não foi possível confirmar a sua identidade com os documentos enviados."}
          </p>
          <Button className="mt-6 rounded-xl" onClick={() => setRestart(true)}>
            Enviar novamente
          </Button>
        </div>
        <SecurityNote />
      </AppShell>
    );
  }

  return (
    <AppShell title="Verificação de identidade">
      <p className="text-center text-sm text-muted-foreground">
        Envie os seus documentos para confirmar a sua identidade.
      </p>

      <div className="mt-5">
        <ProgressSteps current={step} />
      </div>

      {step === 1 ? (
        <div className="mt-6 animate-fade-up">
          <div className="rounded-3xl bg-card p-5 shadow-card">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <IdCard className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold">Envie o seu Bilhete de Identidade</p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <UploadBox
                label="Frente do BI"
                preview={frontPreview}
                onPick={(f) => {
                  setFront(f);
                  setFrontPreview(URL.createObjectURL(f));
                }}
                onClear={() => {
                  setFront(null);
                  setFrontPreview(null);
                }}
                compact
              />
              <UploadBox
                label="Verso do BI"
                preview={backPreview}
                onPick={(f) => {
                  setBack(f);
                  setBackPreview(URL.createObjectURL(f));
                }}
                onClear={() => {
                  setBack(null);
                  setBackPreview(null);
                }}
                compact
              />
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              Certifique-se de que todos os dados estão visíveis e legíveis.
            </p>
          </div>

          <Button
            className="mt-5 h-12 w-full rounded-2xl text-sm font-semibold"
            disabled={!front || !back}
            onClick={() => setStep(2)}
          >
            Continuar
          </Button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-6 animate-fade-up">
          <div className="rounded-3xl bg-card p-5 shadow-card">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Camera className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold">Envie uma selfie segurando o seu BI</p>
            </div>

            <div className="mt-4 flex items-center justify-center gap-3 rounded-2xl bg-secondary/60 py-5">
              <UserRound className="h-10 w-10 text-primary" strokeWidth={1.5} />
              <IdCard className="h-9 w-9 -rotate-6 text-gold" strokeWidth={1.5} />
            </div>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
              O seu rosto e o documento devem estar claramente visíveis.
            </p>

            <div className="mt-4">
              <UploadBox
                label="Selecionar imagem"
                preview={selfiePreview}
                onPick={(f) => {
                  setSelfie(f);
                  setSelfiePreview(URL.createObjectURL(f));
                }}
                onClear={() => {
                  setSelfie(null);
                  setSelfiePreview(null);
                }}
              />
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <Button variant="outline" className="h-12 rounded-2xl" onClick={() => setStep(1)}>
              Voltar
            </Button>
            <Button
              className="h-12 flex-1 rounded-2xl text-sm font-semibold"
              disabled={!selfie}
              onClick={() => setStep(3)}
            >
              Continuar
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="mt-6 animate-fade-up">
          <div className="rounded-3xl bg-card p-5 shadow-card">
            <p className="text-sm font-semibold">Resumo dos documentos</p>
            <div className="mt-3 space-y-2.5">
              {[
                { label: "Frente do BI", ok: !!front },
                { label: "Verso do BI", ok: !!back },
                { label: "Selfie com o BI", ok: !!selfie },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center gap-3 rounded-xl bg-secondary/60 px-3 py-2.5"
                >
                  <CheckCircle2
                    className={cn("h-4.5 w-4.5", row.ok ? "text-success" : "text-muted-foreground/40")}
                  />
                  <span className="text-sm">{row.label}</span>
                </div>
              ))}
            </div>

            <label className="mt-4 flex cursor-pointer items-start gap-2.5">
              <Checkbox
                checked={confirmed}
                onCheckedChange={(v) => setConfirmed(v === true)}
                className="mt-0.5"
              />
              <span className="text-xs leading-relaxed text-muted-foreground">
                Confirmo que as informações enviadas são verdadeiras.
              </span>
            </label>
          </div>

          <div className="mt-5 flex gap-3">
            <Button
              variant="outline"
              className="h-12 rounded-2xl"
              onClick={() => setStep(2)}
              disabled={submitting}
            >
              Voltar
            </Button>
            <Button
              className="h-12 flex-1 rounded-2xl text-sm font-semibold"
              disabled={!confirmed || submitting}
              onClick={handleSubmit}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Enviar para verificação"
              )}
            </Button>
          </div>
        </div>
      ) : null}

      <SecurityNote />
    </AppShell>
  );
}
