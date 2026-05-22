import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { fetchMpPayment } from "@/lib/mercadopago.functions";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { logSecurityEvent } from "@/lib/security-log.server";


function mapStatus(mpStatus: string): string {
  switch (mpStatus) {
    case "approved": return "pago";
    case "pending":
    case "in_process":
    case "authorized": return "pendente";
    case "rejected":
    case "cancelled":
    case "refunded":
    case "charged_back": return "falhou";
    default: return mpStatus;
  }
}

function verifyMpSignature(req: Request, dataId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.error("MERCADOPAGO_WEBHOOK_SECRET não configurado — rejeitando webhook");
    return false;
  }
  const sigHeader = req.headers.get("x-signature");
  const requestId = req.headers.get("x-request-id");
  if (!sigHeader || !requestId) return false;

  // x-signature format: "ts=1700000000,v1=hexsig"
  const parts = Object.fromEntries(
    sigHeader.split(",").map((p) => p.trim().split("=").map((s) => s.trim())),
  ) as Record<string, string>;
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  // Reject stale/replayed requests (timestamp must be within ±5 minutes)
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum) || Math.abs(Date.now() - tsNum) > 5 * 60 * 1000) {
    return false;
  }

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  try {
    const a = Buffer.from(v1, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/public/mp/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const topic = url.searchParams.get("type") ?? url.searchParams.get("topic");
        const idParam = url.searchParams.get("data.id") ?? url.searchParams.get("id");

        let paymentId: string | null = idParam;
        if (!paymentId) {
          try {
            const body = await request.clone().json();
            paymentId = body?.data?.id?.toString() ?? null;
          } catch {
            // ignore
          }
        }

        if (!paymentId || (topic && topic !== "payment")) {
          return new Response("ignored", { status: 200 });
        }

        if (!verifyMpSignature(request, paymentId)) {
          await logSecurityEvent({
            eventType: "payment.webhook.invalid_signature",
            severity: "warn",
            metadata: { provider: "mercadopago", paymentId },
          });
          return new Response("invalid signature", { status: 401 });
        }

        try {
          const payment = await fetchMpPayment(paymentId);
          const status = mapStatus(payment.status);
          const agId = payment.external_reference;

          if (agId) {
            // Dedup: skip if this payment event was already recorded
            const { data: existing } = await supabaseAdmin
              .from("payment_events")
              .select("id")
              .eq("provider", "mercadopago")
              .eq("external_id", String(payment.id))
              .maybeSingle();

            if (existing) {
              await logSecurityEvent({
                eventType: "payment.webhook.duplicate",
                metadata: { provider: "mercadopago", paymentId: String(payment.id) },
              });
              return new Response("ok (duplicate)", { status: 200 });
            }


            // Validate amount against stored appointment price before marking as paid
            if (status === "pago") {
              const { data: ag } = await supabaseAdmin
                .from("agendamentos")
                .select("preco")
                .eq("id", agId)
                .maybeSingle();

              const expected = Number(ag?.preco ?? 0);
              const received = Number((payment as { transaction_amount?: number }).transaction_amount ?? 0);
              if (expected > 0 && Math.abs(expected - received) > 0.01) {
                await logSecurityEvent({
                  eventType: "payment.amount.mismatch",
                  severity: "critical",
                  metadata: {
                    provider: "mercadopago",
                    agendamentoId: agId,
                    paymentId: String(payment.id),
                    expected,
                    received,
                  },
                });
                await supabaseAdmin.from("payment_events").insert({
                  provider: "mercadopago",
                  external_id: String(payment.id),
                  agendamento_id: agId,
                  status: "falhou",
                  raw: JSON.parse(JSON.stringify(payment)),
                });
                return new Response("amount mismatch", { status: 200 });
              }
            }


            await supabaseAdmin
              .from("agendamentos")
              .update({ pagamento_status: status, pagamento_id: String(payment.id) })
              .eq("id", agId);

            await supabaseAdmin.from("payment_events").insert({
              provider: "mercadopago",
              external_id: String(payment.id),
              agendamento_id: agId,
              status,
              raw: JSON.parse(JSON.stringify(payment)),
            });
            await logSecurityEvent({
              eventType: "payment.webhook.received",
              metadata: { provider: "mercadopago", agendamentoId: agId, status },
            });
          }
          return new Response("ok", { status: 200 });
        } catch (e) {
          console.error("MP webhook error:", e);
          return new Response("error", { status: 500 });
        }


      },
    },
  },
});
