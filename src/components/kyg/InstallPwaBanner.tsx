import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

const DISMISS_KEY = "kyg-install-dismissed";

export function InstallPwaBanner() {
  const { canInstall, isIos, isStandalone, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (isStandalone || dismissed) return null;

  const showIosHint = isIos && !canInstall;
  if (!canInstall && !showIosHint) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="fixed bottom-24 left-1/2 z-20 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 animate-fade-up">
      <div className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-card">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-gold">
          <Download className="h-5 w-5" />
        </div>
        <div className="flex-1 text-sm">
          {showIosHint ? (
            <p className="text-foreground">
              Para instalar, toca em <span className="font-semibold">Partilhar</span> e depois{" "}
              <span className="font-semibold">Adicionar ao Ecrã Principal</span>.
            </p>
          ) : (
            <p className="font-semibold text-foreground">Instalar o KYG no teu dispositivo</p>
          )}
        </div>
        {!showIosHint && (
          <button
            onClick={promptInstall}
            className="shrink-0 rounded-xl bg-gold px-3 py-1.5 text-xs font-semibold text-gold-foreground hover:bg-gold/90"
          >
            Instalar
          </button>
        )}
        <button
          onClick={dismiss}
          aria-label="Fechar"
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
