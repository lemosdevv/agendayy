import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { logSecurityEvent, type SecurityEventType } from "@/lib/security-log.server";

// Apenas estes eventos podem ser disparados pelo cliente (whitelist).
// Eventos sensíveis (webhooks, pagamentos) NÃO entram aqui.
const ALLOWED_EVENTS = [
  "auth.signin.success",
  "auth.signin.failed",
  "auth.signup",
  "auth.password.weak_rejected",
] as const satisfies readonly SecurityEventType[];

const InputSchema = z.object({
  eventType: z.enum(ALLOWED_EVENTS),
  // Metadados pequenos e seguros. Nunca envie senha, token, etc.
  emailHashed: z.string().max(64).optional(),
  reason: z.string().max(120).optional(),
});

/**
 * Server fn pública (não exige auth) para registrar eventos de auth iniciados
 * no cliente — login falho, signup, etc. Falha silenciosa.
 */
export const logAuthEvent = createServerFn({ method: "POST" })
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const severity = data.eventType === "auth.signin.failed" ? "warn" : "info";
    await logSecurityEvent({
      eventType: data.eventType,
      severity,
      metadata: {
        ...(data.emailHashed ? { emailHashed: data.emailHashed } : {}),
        ...(data.reason ? { reason: data.reason } : {}),
      },
    });
    return { ok: true };
  });
