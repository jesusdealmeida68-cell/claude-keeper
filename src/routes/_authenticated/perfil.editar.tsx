import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/kyg/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/perfil/editar")({
  component: EditarPerfilPage,
});

function EditarPerfilPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: () => getMyProfile(user.id),
  });
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const value = name ?? profile?.full_name ?? "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: value })
        .eq("user_id", user.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast.success("Perfil atualizado.");
      navigate({ to: "/perfil" });
    } catch {
      toast.error("Não foi possível atualizar o perfil.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="Editar perfil">
      <form onSubmit={handleSubmit} className="space-y-5 animate-fade-up">
        <div className="space-y-2">
          <Label htmlFor="name">Nome completo</Label>
          <Input
            id="name"
            value={value}
            onChange={(e) => setName(e.target.value)}
            required
            className="h-12 rounded-xl bg-card"
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-xl bg-gold text-base font-semibold text-gold-foreground hover:bg-gold/90"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Guardar"}
        </Button>
      </form>
    </AppShell>
  );
}
