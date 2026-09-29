import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KygLogo } from "./KygLogo";
import { ShieldCheck } from "lucide-react";

const STORAGE_KEY = "kyg_admin_gate";
// Acesso partilhado da área de administração: quem tiver estas credenciais entra.
const ADMIN_USERNAME = "Huambo123";
const ADMIN_PASSWORD = "196411aA";

function isUnlocked() {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(STORAGE_KEY) === "ok";
}

export function lockAdminGate() {
  sessionStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}

export function AdminGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(isUnlocked);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (unlocked) return <>{children}</>;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, "ok");
      setUnlocked(true);
      setError("");
    } else {
      setError("Utilizador ou código de acesso incorretos.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-card animate-fade-up">
        <div className="flex flex-col items-center text-center">
          <KygLogo size="lg" />
          <div className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <ShieldCheck className="h-4 w-4" /> Acesso restrito · Admin Pioneer
          </div>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-user">Utilizador</Label>
            <Input
              id="admin-user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-12 rounded-xl"
              autoFocus
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-pass">Código de acesso</Label>
            <Input
              id="admin-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl"
              autoComplete="current-password"
            />
          </div>
          {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
          <Button
            type="submit"
            className="h-12 w-full rounded-xl bg-gold font-semibold text-gold-foreground hover:bg-gold/90"
          >
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
