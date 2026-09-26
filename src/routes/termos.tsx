import { createFileRoute, Link } from "@tanstack/react-router";
import { KygLogo } from "@/components/kyg/KygLogo";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos e condições — KYG" },
      { name: "description", content: "Termos e condições de utilização do KYG." },
      { property: "og:title", content: "Termos e condições — KYG" },
      { property: "og:description", content: "Termos e condições de utilização do KYG." },
    ],
  }),
  component: TermosPage,
});

function TermosPage() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-background px-6 pb-16 pt-10">
      <KygLogo size="sm" />
      <h1 className="mt-6 text-2xl font-bold tracking-tight">Termos e condições</h1>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          O KYG é uma plataforma de gestão e envio de comprovativos de serviços. Ao criar uma conta,
          concordas em fornecer informações verdadeiras e em utilizar a plataforma apenas para os
          fins a que se destina.
        </p>
        <p>
          Os comprovativos enviados são submetidos a análise. A aprovação ou não aprovação é
          comunicada através da aplicação, podendo incluir uma observação da equipa de análise.
        </p>
        <p>
          O KYG reserva-se o direito de suspender contas que violem estes termos ou que enviem
          conteúdo falso, fraudulento ou ilegal.
        </p>
      </div>
      <Link to="/perfil" className="mt-8 inline-flex items-center gap-1 text-sm font-semibold text-gold hover:underline">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
    </div>
  );
}
