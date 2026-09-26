import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { KygLogo } from "@/components/kyg/KygLogo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KYG — Gestão simples de serviços" },
      { name: "description", content: "Envie e acompanhe comprovativos de serviços com o KYG." },
      { property: "og:title", content: "KYG — Gestão simples de serviços" },
      {
        property: "og:description",
        content: "Envie e acompanhe comprovativos de serviços com o KYG.",
      },
    ],
  }),
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      navigate({ to: data.user ? "/inicio" : "/auth", replace: true });
    }, 1800);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary px-6">
      <div className="animate-scale-in">
        <KygLogo size="lg" className="bg-card text-primary shadow-card-lg" />
      </div>
      <p className="mt-6 animate-fade-up text-sm font-medium tracking-wide text-primary-foreground/70 [animation-delay:300ms]">
        Gestão simples de serviços
      </p>
    </div>
  );
}
