import { createFileRoute, Link } from "@tanstack/react-router";
import { KygLogo } from "@/components/kyg/KygLogo";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos e condições — Pioneer" },
      { name: "description", content: "Termos e condições de utilização do Pioneer." },
      { property: "og:title", content: "Termos e condições — Pioneer" },
      { property: "og:description", content: "Termos e condições de utilização do Pioneer." },
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
          O Pioneer é uma plataforma que liga utilizadores a pequenos trabalhos remunerados
          (tarefas), publicados por comerciantes, com pagamento através de uma carteira interna. Ao
          criar uma conta, concordas em fornecer informações verdadeiras e em utilizar a plataforma
          apenas para os fins a que se destina.
        </p>
        <p>
          <strong className="font-semibold text-foreground">Trabalhos e candidaturas.</strong> Ao
          candidatares-te a um trabalho, submetes uma evidência (imagem e/ou texto) que é analisada
          pela nossa equipa ou pelo comerciante responsável. A aprovação ou não aprovação é
          comunicada na aplicação, podendo incluir o motivo da decisão. Só trabalhos aprovados geram
          saldo na tua carteira.
        </p>
        <p>
          <strong className="font-semibold text-foreground">Carteira e saques.</strong> O saldo
          acumulado pode ser levantado através dos métodos disponíveis na aplicação (ex.: IBAN,
          Unitel Money). Os pedidos de saque são processados pela nossa equipa e podem ser recusados
          caso as informações fornecidas estejam incorretas ou incompletas — nesse caso, o motivo é
          apresentado na aplicação.
        </p>
        <p>
          <strong className="font-semibold text-foreground">Verificação de identidade.</strong> Para
          confirmar a tua identidade, poderá ser-te pedido o envio do teu Bilhete de Identidade
          (frente e verso) e uma selfie segurando o documento. Estes dados são analisados
          exclusivamente para esse fim.
        </p>
        <p>
          <strong className="font-semibold text-foreground">Comerciantes.</strong> Utilizadores que
          publicam trabalhos são responsáveis pela veracidade das tarefas anunciadas e pelo pagamento
          correspondente através da plataforma.
        </p>
        <p>
          O Pioneer reserva-se o direito de suspender contas que violem estes termos ou que enviem
          conteúdo falso, fraudulento, documentos adulterados ou ilegal.
        </p>
        <p>
          Estes termos podem ser atualizados periodicamente; alterações relevantes serão comunicadas
          na aplicação.
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
