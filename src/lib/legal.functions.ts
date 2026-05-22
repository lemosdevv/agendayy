import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { logSecurityEvent } from "@/lib/security-log.server";


const InputSchema = z.object({
  termsVersion: z.string().min(1).max(20),
  privacyVersion: z.string().min(1).max(20),
});

/**
 * Registra o aceite dos Termos de Uso e Política de Privacidade
 * do usuário autenticado. Captura IP e user-agent para evidência.
 * Idempotente por (user_id, terms_version, privacy_version, mesma sessão).
 */
export const recordTermsAcceptance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    // Headers de evidência (best-effort; podem vir vazios atrás de alguns proxies)
    const ip =
      getRequestHeader("cf-connecting-ip") ??
      getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ??
      getRequestHeader("x-real-ip") ??
      null;
    const userAgent = getRequestHeader("user-agent") ?? null;

    // Já existe aceite dessa mesma versão? Evita linhas duplicadas no banco.
    const { data: existing } = await supabaseAdmin
      .from("terms_acceptances")
      .select("id")
      .eq("user_id", userId)
      .eq("terms_version", data.termsVersion)
      .eq("privacy_version", data.privacyVersion)
      .limit(1)
      .maybeSingle();

    if (existing) return { ok: true, alreadyAccepted: true };

    const { error } = await supabaseAdmin.from("terms_acceptances").insert({
      user_id: userId,
      terms_version: data.termsVersion,
      privacy_version: data.privacyVersion,
      ip_address: ip,
      user_agent: userAgent,
    });

    if (error) throw new Error("Não foi possível registrar o aceite. Tente novamente.");

    await logSecurityEvent({
      eventType: "legal.terms.accepted",
      userId,
      metadata: { termsVersion: data.termsVersion, privacyVersion: data.privacyVersion },
    });

    return { ok: true, alreadyAccepted: false };
  });

