import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { genericAuthErrorMessage } from "@/lib/password-policy";
import { logAuthEvent } from "@/lib/security-log.functions";
import { lovable } from "@/integrations/lovable";
import logoAgenday from "@/assets/logo.png";



export const Route = createFileRoute("/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar — Agenday" },
      { name: "description", content: "Acesse sua conta Agenday e gerencie sua agenda, clientes e profissionais." },
      { property: "og:title", content: "Entrar — Agenday" },
      { property: "og:description", content: "Acesse sua conta Agenday." },
      { property: "og:url", content: "https://agenday.lovable.app/entrar" },
    ],
    links: [{ rel: "canonical", href: "https://agenday.lovable.app/entrar" }],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: LoginPage,
});

async function sha256Hex(input: string): Promise<string> {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return "";
  }
}

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const logAuth = useServerFn(logAuthEvent);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    setLoading(false);
    const emailHashed = (await sha256Hex(normalizedEmail)).slice(0, 32);
    if (error) {
      if (import.meta.env.DEV) console.warn("[auth] sign-in failed:", error.message);
      // best-effort audit log — não bloqueia
      logAuth({ data: { eventType: "auth.signin.failed", emailHashed } }).catch(() => {});
      toast.error(genericAuthErrorMessage(error.message));
      return;
    }
    logAuth({ data: { eventType: "auth.signin.success", emailHashed } }).catch(() => {});

    toast.success("Bem-vinda de volta!");
    if (redirect) {
      try {
        window.location.href = decodeURIComponent(redirect);
        return;
      } catch {
        // fallthrough
      }
    }
    navigate({ to: "/app" });
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-warm px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex justify-center mb-8" aria-label="Agenday">
          <img src={logoAgenday} alt="Agenday" className="h-20 w-auto object-contain" />
        </Link>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          <h1 className="font-display text-2xl font-semibold mb-1">Entrar</h1>
          <p className="text-sm text-ink-soft mb-6">Acesse sua agenda e seus clientes.</p>
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4"
            disabled={loading}
            onClick={async () => {
              const result = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: `${window.location.origin}/app`,
              });
              if (result.error) {
                toast.error("Não foi possível entrar com Google. Tente novamente.");
              }
            }}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
            </svg>
            Continuar com Google
          </Button>
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-ink-soft">ou com e-mail</span></div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <p className="mt-6 text-sm text-center text-ink-soft">
            Ainda não tem conta?{" "}
            <Link to="/cadastro" className="text-brand-600 font-medium hover:underline">
              Criar conta grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
