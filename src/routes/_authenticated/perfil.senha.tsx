import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/kyg/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/perfil/senha")({
  component: AlterarSenhaPage,
});

function AlterarSenhaPage() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: next,
        current_password: current,
      });
      if (error) throw error;
      toast.success("Senha alterada com sucesso.");
      navigate({ to: "/perfil" });
    } catch {
      toast.error("Não foi possível alterar a senha. Confirma a senha atual.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="Alterar senha">
      <form onSubmit={handleSubmit} className="space-y-5 animate-fade-up">
        <div className="space-y-2">
          <Label htmlFor="cur">Senha atual</Label>
          <Input
            id="cur"
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
            className="h-12 rounded-xl bg-card"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new">Nova senha</Label>
          <Input
            id="new"
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
            minLength={6}
            className="h-12 rounded-xl bg-card"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="conf">Confirmar nova senha</Label>
          <Input
            id="conf"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
            className="h-12 rounded-xl bg-card"
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-xl bg-gold text-base font-semibold text-gold-foreground hover:bg-gold/90"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Alterar senha"}
        </Button>
      </form>
    </AppShell>
  );
}
