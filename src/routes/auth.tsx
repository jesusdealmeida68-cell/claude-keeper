import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KygLogo } from "@/components/kyg/KygLogo";
import { signInWithPhone, signUpWithPhone } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — KYG" },
      { name: "description", content: "Entre na sua conta KYG para acompanhar os seus comprovativos." },
      { property: "og:title", content: "Entrar — KYG" },
      { property: "og:description", content: "Entre na sua conta KYG para acompanhar os seus comprovativos." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background pb-10">
      <div className="relative h-56 w-full overflow-hidden rounded-b-3xl bg-primary shadow-card-lg animate-fade-in">
        <img
          src="/hero-warriors.jpg"
          alt=""
          className="h-full w-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/10 to-transparent" />
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
          <KygLogo size="md" className="ring-4 ring-background" />
        </div>
      </div>

      <div className="px-6 pt-14">
        {mode === "login" ? (
          <LoginForm onSwitch={() => setMode("signup")} />
        ) : (
          <SignupForm onSwitch={() => setMode("login")} />
        )}
      </div>
    </div>
  );
}

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithPhone(phone, password);
      navigate({ to: "/inicio", replace: true });
    } catch {
      toast.error("Número de telefone ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 animate-fade-up space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bem-vindo de volta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Entre para acompanhar os seus comprovativos.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Número de telefone</Label>
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          placeholder="9XX XXX XXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="h-12 rounded-xl bg-card"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="h-12 rounded-xl bg-card"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="h-12 w-full rounded-xl bg-gold text-base font-semibold text-gold-foreground hover:bg-gold/90"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Ainda não tens conta?{" "}
        <button type="button" onClick={onSwitch} className="font-semibold text-gold hover:underline">
          Criar uma conta
        </button>
      </p>
    </form>
  );
}

function SignupForm({ onSwitch }: { onSwitch: () => void }) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 9) {
      toast.error("Use um número angolano válido.");
      return;
    }
    setLoading(true);
    try {
      await signUpWithPhone(fullName, phone, password);
      toast.success("Conta criada com sucesso!");
      navigate({ to: "/inicio", replace: true });
    } catch (err) {
      const msg = err instanceof Error && err.message.includes("already")
        ? "Este número já está registado. Tenta entrar."
        : "Não foi possível criar a conta. Tenta novamente.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 animate-fade-up space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Criar conta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Regista-te para enviar os teus comprovativos.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nome completo</Label>
        <Input
          id="name"
          placeholder="O teu nome"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="h-12 rounded-xl bg-card"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="s-phone">Número de telefone</Label>
        <Input
          id="s-phone"
          type="tel"
          inputMode="tel"
          placeholder="9XX XXX XXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="h-12 rounded-xl bg-card"
        />
        <p className="text-xs text-muted-foreground">Use um número angolano válido.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="s-password">Senha</Label>
        <Input
          id="s-password"
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="h-12 rounded-xl bg-card"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="s-confirm">Confirmar senha</Label>
        <Input
          id="s-confirm"
          type="password"
          placeholder="Repete a senha"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={6}
          className="h-12 rounded-xl bg-card"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="h-12 w-full rounded-xl bg-gold text-base font-semibold text-gold-foreground hover:bg-gold/90"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Criar conta"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Já tens uma conta?{" "}
        <button type="button" onClick={onSwitch} className="font-semibold text-gold hover:underline">
          Entrar
        </button>
      </p>
    </form>
  );
}
