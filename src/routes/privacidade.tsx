import { createFileRoute, Link } from "@tanstack/react-router";
import { KygLogo } from "@/components/kyg/KygLogo";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Privacidade — Pioneer" },
      { name: "description", content: "Política de privacidade do Pioneer." },
      { property: "og:title", content: "Privacidade — Pioneer" },
      { property: "og:description", content: "Política de privacidade do Pioneer." },
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
          Recolhemos os dados necessários ao funcionamento da plataforma: nome, número de telefone,
          e-mail de acesso, e os conteúdos que envias — evidências de trabalhos, documentos de
          identidade (BI frente/verso e selfie) e dados de saque (ex.: IBAN ou número Unitel Money).
        </p>
        <p>
          <strong className="font-semibold text-foreground">Documentos de identidade.</strong> São
          armazenados de forma privada e encriptada, acessíveis apenas por ti e pela nossa equipa de
          verificação, e utilizados exclusivamente para confirmar a tua identidade — nunca
          partilhados com terceiros.
        </p>
        <p>
          <strong className="font-semibold text-foreground">Dados financeiros.</strong> O teu saldo e
          os dados de saque são utilizados apenas para processar os pagamentos que solicitas.
        </p>
        <p>
          <strong className="font-semibold text-foreground">Anúncios.</strong> Podemos mostrar
          conteúdo patrocinado (anúncios/notícias) na aplicação. Este conteúdo é definido pela nossa
          equipa e não utiliza os teus dados pessoais para segmentação.
        </p>
        <p>
          Não vendemos nem partilhamos os teus dados com terceiros para fins comerciais. Podes
          solicitar a correção ou eliminação dos teus dados a qualquer momento através dos canais de
          apoio do Pioneer.
        </p>
      </div>
      <Link
        to="/perfil"
        className="mt-8 inline-flex items-center gap-1 text-sm font-semibold text-gold hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
    </div>
  );
}
