// Helper server-side para gravar eventos em public.security_logs.
// Use APENAS dentro de createServerFn / server routes — NUNCA em client code.
//
// Filosofia:
// - Logs nunca devem quebrar o fluxo do usuário (falha silenciosa).
// - Nunca logar senha, token, CPF completo, número de cartão, secret.
// - Metadata aceita objetos pequenos com chaves serializáveis.

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getRequestHeader } from "@tanstack/react-start/server";

export type SecuritySeverity = "info" | "warn" | "error" | "critical";

export type SecurityEventType =
  // Auth
  | "auth.signup"
  | "auth.signin.success"
  | "auth.signin.failed"
  | "auth.password.weak_rejected"
  // Termos / LGPD
  | "legal.terms.accepted"
  // Pagamento
  | "payment.webhook.received"
  | "payment.webhook.invalid_signature"
  | "payment.webhook.duplicate"
  | "payment.amount.mismatch"
  | "payment.subscription.created"
  | "payment.subscription.authorized"
  | "payment.subscription.paid"
  | "payment.subscription.cancelled"
  // Misc
  | "security.access_denied"
  | "security.input.invalid";

interface LogParams {
  eventType: SecurityEventType;
  severity?: SecuritySeverity;
  userId?: string | null;
  tenantId?: string | null;
  metadata?: Record<string, unknown>;
  /**
   * Quando true, tenta capturar IP/user-agent da request atual.
   * Default true. Defina false em contextos sem request (jobs, etc).
   */
  captureRequest?: boolean;
}

function safeHeader(name: string): string | null {
  try {
    return getRequestHeader(name) ?? null;
  } catch {
    return null;
  }
}

function getClientIp(): string | null {
  return (
    safeHeader("cf-connecting-ip") ??
    safeHeader("x-forwarded-for")?.split(",")[0]?.trim() ??
    safeHeader("x-real-ip") ??
    null
  );
}

/**
 * Grava um evento de segurança. Nunca lança — falhas são logadas no console
 * do servidor mas não quebram o fluxo do chamador.
 */
export async function logSecurityEvent(params: LogParams): Promise<void> {
  const {
    eventType,
    severity = "info",
    userId = null,
    tenantId = null,
    metadata = {},
    captureRequest = true,
  } = params;

  try {
    const ip = captureRequest ? getClientIp() : null;
    const ua = captureRequest ? safeHeader("user-agent") : null;

    await supabaseAdmin.from("security_logs").insert({
      event_type: eventType,
      severity,
      user_id: userId,
      tenant_id: tenantId,
      ip_address: ip,
      user_agent: ua?.slice(0, 500) ?? null,
      // cast: jsonb column accepts arbitrary JSON; tipos gerados são restritivos.
      metadata: metadata as never,
    });

  } catch (e) {
    // Nunca propagar — logs são best-effort.
    console.error("[security-log] failed to write event", eventType, e);
  }
}
