import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Home, Send, FileText, User } from "lucide-react";
import type { ReactNode } from "react";
import { KygLogo } from "./KygLogo";

const navItems = [
  { to: "/inicio", label: "Início", icon: Home },
  { to: "/enviar", label: "Enviar", icon: Send },
  { to: "/envios", label: "Envios", icon: FileText },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-card/90 px-5 py-3 backdrop-blur">
        <KygLogo size="sm" />
        {title ? <h1 className="text-lg font-semibold tracking-tight">{title}</h1> : null}
      </header>

      <main className="flex-1 px-5 pb-28 pt-5">{children}</main>

      <nav className="fixed bottom-0 left-1/2 z-10 w-full max-w-md -translate-x-1/2 border-t bg-card/95 backdrop-blur">
        <div className="grid grid-cols-4">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-gold" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
