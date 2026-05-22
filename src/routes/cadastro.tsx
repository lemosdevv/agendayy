import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { MessageCircle, CheckCircle2 } from "lucide-react";
import logoAgenday from "@/assets/logo.png";
import { TERMS_VERSION, PRIVACY_VERSION } from "@/lib/legal-constants";
import { recordTermsAcceptance } from "@/lib/legal.functions";
import { validatePassword, PASSWORD_RULES_TEXT, genericAuthErrorMessage } from "@/lib/password-policy";
import { lovable } from "@/integrations/lovable";


export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Teste grátis — Agenday" },
      { name: "description", content: "Crie sua conta Agenday em menos de 1 minuto e teste grátis por 15 dias. Sem cartão de crédito." },
      { property: "og:title", content: "Teste grátis — Agenday" },
      { property: "og:description", content: "Crie sua conta Agenday e teste grátis por 15 dias. Sem cartão de crédito." },
      { property: "og:url", content: "https://agenday.lovable.app/cadastro" },
    ],
    links: [{ rel: "canonical", href: "https://agenday.lovable.app/cadastro" }],
  }),
  component: SignupPage,
});

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55")) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ name: string; waLink: string; needsEmailConfirm: boolean } | null>(null);
  const recordAcceptance = useServerFn(recordTermsAcceptance);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      toast.error("Você precisa aceitar os Termos de Uso e a Política de Privacidade.");
      return;
    }
    const pwdError = validatePassword(password);
    if (pwdError) {
      toast.error(pwdError);
      return;
    }
    const phone = normalizePhone(whatsapp);
    if (phone.length < 12) {
      toast.error("Informe um WhatsApp válido com DDD.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: { full_name: fullName.trim(), phone },
      },
    });
    if (error) {
      setLoading(false);
      if (import.meta.env.DEV) console.warn("[auth] sign-up failed:", error.message);
      const msg = error.message.toLowerCase();
      if (msg.includes("registered") || msg.includes("already")) {
        // Não confirma se o e-mail existe — orienta de forma neutra.
        toast.error("Não foi possível criar a conta. Se você já tem cadastro, faça login.");
      } else {
        toast.error(genericAuthErrorMessage(error.message));
      }
      return;
    }


    const hasSession = !!data.session;

    // Atualiza profile e registra aceite só se já há sessão (sem sessão, RLS bloqueia).
    if (hasSession && data.user) {
      await supabase.from("profiles").update({ phone, full_name: fullName }).eq("id", data.user.id);
      // Registra aceite dos termos. Falha silenciosa não bloqueia signup —
      // o checkbox marcado já é evidência do consentimento; em produção
      // monitorar via security_logs (Fase 5).
      try {
        await recordAcceptance({ data: { termsVersion: TERMS_VERSION, privacyVersion: PRIVACY_VERSION } });
      } catch {
        // não bloqueia
      }
    }

    const dashboardUrl = `${window.location.origin}/app`;
    const message = `Olá, ${fullName.split(" ")[0]}! 👋\n\nSeu acesso à Agenday está pronto.\nAcesse seu dashboard aqui: ${dashboardUrl}`;
    const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    setLoading(false);
    setSuccess({ name: fullName.split(" ")[0], waLink, needsEmailConfirm: !hasSession });
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-warm px-4 py-12">
        <div className="w-full max-w-md text-center">
          <Link to="/" className="flex justify-center mb-8" aria-label="Agenday">
            <img src={logoAgenday} alt="Agenday" className="h-20 w-auto object-contain" />
          </Link>
          <div className="bg-card rounded-2xl shadow-lg border border-border p-8">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            {success.needsEmailConfirm ? (
              <>
                <h1 className="font-display text-2xl font-bold mb-2">Confirme seu e-mail, {success.name}! 📧</h1>
                <p className="text-sm text-ink-soft mb-6">
                  Enviamos um link de confirmação para <strong className="text-ink">{email}</strong>.
                  Clique nele para ativar sua conta e acessar o dashboard.
                </p>
                <Link
                  to="/entrar"
                  className="inline-flex w-full items-center justify-center rounded-full border border-brand-200 bg-white px-6 py-3 text-sm font-medium text-ink hover:bg-brand-50"
                >
                  Ir para login
                </Link>
              </>
            ) : (
              <>
                <h1 className="font-display text-2xl font-bold mb-2">Tudo pronto, {success.name}! 🎉</h1>
                <p className="text-sm text-ink-soft mb-6">
                  Sua conta foi criada. Acesse o dashboard ou receba o link no WhatsApp.
                </p>
                <Link
                  to="/app"
                  className="inline-flex w-full min-h-14 items-center justify-center rounded-full bg-brand-600 px-6 py-4 text-base font-semibold text-white shadow-md transition hover:bg-brand-700"
                >
                  Ir para o dashboard
                </Link>
                <a
                  href={success.waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#25D366]/40 bg-white px-6 py-3 text-sm font-medium text-[#128C7E] hover:bg-[#25D366]/5"
                >
                  <MessageCircle className="h-4 w-4" />
                  Receber link no WhatsApp
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-warm px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex justify-center mb-8" aria-label="Agenday">
          <img src={logoAgenday} alt="Agenday" className="h-20 w-auto object-contain" />
        </Link>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          <h1 className="font-display text-2xl font-bold mb-1">Teste grátis por 15 dias</h1>
          <p className="text-sm text-ink-soft mb-6">Sem cartão de crédito · Comece em menos de 1 minuto</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Seu nome</Label>
              <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp (com DDD)</Label>
              <Input
                id="whatsapp"
                type="tel"
                required
                placeholder="(11) 91234-5678"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                autoComplete="tel"
              />
              <p className="text-xs text-ink-soft">Usaremos para enviar o link de acesso, se quiser.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
              <p className="text-xs text-ink-soft">{PASSWORD_RULES_TEXT}</p>

            </div>
            <div className="flex items-start gap-2 pt-1">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(v) => setAcceptedTerms(v === true)}
                className="mt-0.5"
              />
              <Label htmlFor="terms" className="text-xs text-ink-soft leading-relaxed font-normal cursor-pointer">
                Li e concordo com os{" "}
                <Link to="/termos" target="_blank" className="text-brand-600 hover:underline font-medium">
                  Termos de Uso
                </Link>{" "}
                e a{" "}
                <Link to="/privacidade" target="_blank" className="text-brand-600 hover:underline font-medium">
                  Política de Privacidade
                </Link>
                .
              </Label>
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full min-h-12 text-base font-semibold"
              disabled={loading || !acceptedTerms}
            >
              {loading ? "Criando sua conta..." : "Teste grátis por 15 dias"}
            </Button>
          </form>
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-ink-soft">ou</span></div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={loading || !acceptedTerms}
            onClick={async () => {
              if (!acceptedTerms) {
                toast.error("Aceite os Termos antes de continuar com Google.");
                return;
              }
              // Marca o aceite no storage para registrar após o callback OAuth.
              try {
                sessionStorage.setItem("agenday.pending_terms_accept", JSON.stringify({ t: TERMS_VERSION, p: PRIVACY_VERSION }));
              } catch { /* noop */ }
              const result = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: `${window.location.origin}/app`,
              });
              if (result.error) {
                toast.error("Não foi possível continuar com Google. Tente novamente.");
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
          <p className="mt-5 text-sm text-center text-ink-soft">
            Já tem conta? <Link to="/entrar" className="text-brand-600 font-medium hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
