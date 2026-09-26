import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/kyg/AppShell";
import { StatusBadge } from "@/components/kyg/StatusBadge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/envios/$id")({
  component: EnvioDetalhePage,
});

function EnvioDetalhePage() {
  const { id } = Route.useParams();

  const { data: s, isLoading } = useQuery({
    queryKey: ["submission", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("submissions").select("*").eq("id", id).single();
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

  if (isLoading || !s) {
    return (
      <AppShell title="Detalhes do envio">
        <p className="text-sm text-muted-foreground">A carregar…</p>
      </AppShell>
    );
  }

  const rows: Array<[string, string | null | undefined]> = [
    ["Serviço", s.service],
    ["Referência", s.reference],
    [
      "Data do serviço",
      s.service_date ? new Date(s.service_date).toLocaleDateString("pt-AO") : null,
    ],
    ["Data de envio", new Date(s.created_at).toLocaleDateString("pt-AO")],
    ["Comprovativo", s.file_name],
    ["Observação", s.note],
  ];

  return (
    <AppShell title="Detalhes do envio">
      <Link
        to="/envios"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="mt-4 rounded-3xl bg-card p-5 shadow-card animate-fade-up">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">{s.service}</h2>
          <StatusBadge status={s.status} />
        </div>

        <dl className="mt-5 space-y-4">
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

        {signedUrl ? (
          <Button asChild variant="outline" className="mt-6 h-11 w-full rounded-xl">
            <a href={signedUrl} target="_blank" rel="noreferrer">
              <FileText className="mr-2 h-4 w-4" /> Ver comprovativo
            </a>
          </Button>
        ) : null}
      </div>

      {s.status === "rejected" && s.review_note ? (
        <div className="mt-4 rounded-3xl border border-destructive/20 bg-destructive-soft p-5 animate-fade-up [animation-delay:100ms]">
          <h3 className="text-sm font-semibold text-destructive">Observação da análise</h3>
          <p className="mt-1 text-sm text-foreground/80">{s.review_note}</p>
        </div>
      ) : null}
    </AppShell>
  );
}
