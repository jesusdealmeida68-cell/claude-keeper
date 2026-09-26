import { createFileRoute, Link } from "@tanstack/react-router";
import { KygLogo } from "@/components/kyg/KygLogo";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Privacidade — KYG" },
      { name: "description", content: "Política de privacidade do KYG." },
      { property: "og:title", content: "Privacidade — KYG" },
      { property: "og:description", content: "Política de privacidade do KYG." },
    ],
  }),
  component: PrivacidadePage,
});

function PrivacidadePage() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-background px-6 pb-16 pt-10">
      <KygLogo size="sm" />
      <h1 className="mt-6 text-2xl font-bold tracking-tight">Privacidade</h1>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          Recolhemos apenas os dados necessários ao funcionamento do serviço: o teu nome, número de
          telefone e os comprovativos que enviares.
        </p>
        <p>
          Os teus dados são utilizados exclusivamente para a gestão e análise dos comprovativos e
          não são partilhados com terceiros para fins comerciais.
        </p>
        <p>
          Podes solicitar a correção ou eliminação dos teus dados a qualquer momento através dos
          canais de apoio do KYG.
        </p>
      </div>
      <Link to="/perfil" className="mt-8 inline-flex items-center gap-1 text-sm font-semibold text-gold hover:underline">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
    </div>
  );
}
