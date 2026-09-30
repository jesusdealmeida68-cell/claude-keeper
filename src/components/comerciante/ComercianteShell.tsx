import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  Bell,
  ClipboardCheck,
  Headset,
  LayoutGrid,
  LifeBuoy,
  ListChecks,
  Menu,
  PlusCircle,
  Wallet2,
} from "lucide-react";

export type ComerciantePage =
  | "visao-geral"
  | "criar-tarefa"
  | "minhas-tarefas"
  | "resultados"
  | "carteira"
  | "relatorios"
  | "suporte";

const NAV: { key: ComerciantePage; label: string; to: string; icon: typeof LayoutGrid }[] = [
  { key: "visao-geral", label: "Visão Geral", to: "/comerciante", icon: LayoutGrid },
  { key: "criar-tarefa", label: "Criar Tarefa", to: "/comerciante/criar-tarefa", icon: PlusCircle },
  {
    key: "minhas-tarefas",
    label: "Minhas Tarefas",
    to: "/comerciante/minhas-tarefas",
    icon: ListChecks,
  },
  { key: "resultados", label: "Resultados", to: "/comerciante/resultados", icon: ClipboardCheck },
  { key: "carteira", label: "Carteira", to: "/comerciante/carteira", icon: Wallet2 },
  { key: "relatorios", label: "Relatórios", to: "/comerciante/relatorios", icon: LifeBuoy },
  { key: "suporte", label: "Suporte", to: "/comerciante/suporte", icon: Headset },
];

function KygMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-black text-white shadow-lg shadow-blue-950/40",
        className,
      )}
    >
      Pioneer
    </div>
  );
}

function NavList({ active, onNavigate }: { active: ComerciantePage; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV.map((item) => {
        const Icon = item.icon;
        const isActive = item.key === active;
        return (
          <Link
            key={item.key}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-blue-500/15 text-blue-400 ring-1 ring-inset ring-blue-500/30"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
            )}
          >
            <Icon className={cn("h-4.5 w-4.5", isActive && "text-blue-400")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function ComercianteShell({
  active,
  title,
  balance,
  children,
}: {
  active: ComerciantePage;
  title: string;
  balance?: string;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-white/5 bg-slate-950 md:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <KygMark />
          <div className="min-w-0">
            <p className="text-sm font-bold tracking-tight text-white">Pioneer</p>
            <p className="text-[11px] text-slate-500">Área do Comerciante</p>
          </div>
        </div>
        <NavList active={active} />
        <div className="mx-3 mb-4 mt-2 rounded-2xl bg-white/5 p-3.5">
          <p className="text-[11px] font-medium text-slate-400">Precisa de ajuda?</p>
          <p className="mt-0.5 text-xs text-slate-500">A nossa equipa responde em poucas horas.</p>
          <Link
            to="/comerciante/suporte"
            className="mt-2.5 block rounded-lg bg-blue-500 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-blue-400"
          >
            Contactar suporte
          </Link>
        </div>
      </aside>

      {/* Sidebar — mobile (drawer) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 border-none bg-slate-950 p-0">
          <SheetTitle className="sr-only">Menu da Área do Comerciante</SheetTitle>
          <div className="flex items-center gap-2.5 px-5 py-5">
            <KygMark />
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-tight text-white">Pioneer</p>
              <p className="text-[11px] text-slate-500">Área do Comerciante</p>
            </div>
          </div>
          <NavList active={active} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Conteúdo */}
      <div className="md:pl-64">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/80 px-5 py-4 backdrop-blur">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-lg font-bold tracking-tight text-slate-900">
            {title}
          </h1>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="hidden items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1.5 text-blue-700 sm:flex">
              <Wallet2 className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">{balance ?? "—"}</span>
            </div>
            <button
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              aria-label="Notificações"
            >
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-blue-500" />
            </button>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
              JA
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
