import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pioneer" },
      {
        name: "description",
        content: "Envie e acompanhe comprovativos de serviços com o Pioneer.",
      },
      { property: "og:title", content: "Pioneer" },
      {
        property: "og:description",
        content: "Envie e acompanhe comprovativos de serviços com o Pioneer.",
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <img
        src="/brand/pioneer-logo.png"
        alt="Pioneer"
        className="h-24 w-auto animate-scale-in drop-shadow-sm"
      />
    </div>
  );
}
