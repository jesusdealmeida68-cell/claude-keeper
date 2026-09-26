import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/kyg/AppShell";
import { StatusBadge } from "@/components/kyg/StatusBadge";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/enviado")({
  component: EnviadoPage,
});

function EnviadoPage() {
  return (
    <AppShell>
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success-soft animate-scale-in">
          <CheckCircle2 className="h-10 w-10 text-success" />
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight animate-fade-up [animation-delay:150ms]">
          Comprovativo enviado
        </h1>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground animate-fade-up [animation-delay:250ms]">
          O seu comprovativo foi enviado e está aguardando análise.
        </p>

        <div className="mt-6 w-full rounded-2xl bg-card p-4 shadow-card animate-fade-up [animation-delay:350ms]">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Estado</span>
            <StatusBadge status="pending" />
          </div>
        </div>

        <Button
          asChild
          className="mt-8 h-12 w-full rounded-xl bg-gold text-base font-semibold text-gold-foreground hover:bg-gold/90 animate-fade-up [animation-delay:450ms]"
        >
          <Link to="/envios">Ver meus envios</Link>
        </Button>
      </div>
    </AppShell>
  );
}
