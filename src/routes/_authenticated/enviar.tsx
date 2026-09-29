import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/kyg/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { getAppSettings } from "@/lib/wallet";
import { CloudUpload, Loader2, FileCheck2, Ban } from "lucide-react";

export const Route = createFileRoute("/_authenticated/enviar")({
  component: EnviarPage,
});

function EnviarPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const service = "Verificação Pioneer";
  const [reference, setReference] = useState("");
  const date = new Date().toISOString().slice(0, 10);
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["app-settings"],
    queryFn: getAppSettings,
  });
  const blocked = settings?.submissions_blocked ?? false;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (blocked) {
      toast.error("Os envios estão temporariamente bloqueados.");
      return;
    }
    if (!file) {
      toast.error("Adiciona o comprovativo (JPG, PNG ou PDF).");
      return;
    }
    setLoading(true);
    try {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("comprovativos").upload(path, file);
      if (upErr) throw upErr;

      const { error } = await supabase.from("submissions").insert({
        user_id: user.id,
        service,
        reference: reference || null,
        service_date: date || null,
        note: note || null,
        file_name: file.name,
        file_url: path,
      });
      if (error) throw error;
      navigate({ to: "/enviado" });
    } catch {
      toast.error("Não foi possível enviar. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="Novo comprovativo">
      {settingsLoading ? null : blocked ? (
        <div className="mt-4 flex flex-col items-center rounded-3xl border border-dashed bg-card px-6 py-12 text-center animate-fade-up">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive-soft text-destructive">
            <Ban className="h-7 w-7" />
          </div>
          <p className="mt-4 text-base font-semibold">Envios temporariamente bloqueados</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Não é possível enviar comprovativos neste momento. Tenta novamente mais tarde.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 animate-fade-up">
          <div className="space-y-2">
            <Label htmlFor="service">Serviço</Label>
            <Input
              id="service"
              value={service}
              readOnly
              disabled
              className="h-12 rounded-xl bg-card"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ref">
              Referência <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="ref"
              placeholder="Nº de referência"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="h-12 rounded-xl bg-card"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={date}
              readOnly
              disabled
              className="h-12 rounded-xl bg-card"
            />
          </div>

          <div className="space-y-2">
            <Label>Comprovativo</Label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed bg-card px-6 py-10 text-center transition-colors hover:border-gold/60 hover:bg-gold-soft/40"
            >
              {file ? (
                <>
                  <FileCheck2 className="h-10 w-10 text-gold" />
                  <p className="mt-3 max-w-full truncate text-sm font-semibold">{file.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Toca para trocar o ficheiro</p>
                </>
              ) : (
                <>
                  <CloudUpload className="h-10 w-10 text-muted-foreground/60" />
                  <p className="mt-3 text-sm font-semibold">Adicionar comprovativo</p>
                  <p className="mt-1 text-xs text-muted-foreground">JPG, PNG ou PDF</p>
                </>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">
              Observação <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="note"
              placeholder="Alguma nota sobre este serviço?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-24 rounded-xl bg-card"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-gold text-base font-semibold text-gold-foreground hover:bg-gold/90"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enviar para análise"}
          </Button>
        </form>
      )}
    </AppShell>
  );
}
