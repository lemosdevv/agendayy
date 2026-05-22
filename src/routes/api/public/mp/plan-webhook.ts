import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { logSecurityEvent } from "@/lib/security-log.server";


const MP_API = "https://api.mercadopago.com";

function verifyMpSignature(req: Request, dataId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.error("MERCADOPAGO_WEBHOOK_SECRET não configurado — rejeitando webhook");
    return false;
  }
  const sigHeader = req.headers.get("x-signature");
  const requestId = req.headers.get("x-request-id");
  if (!sigHeader || !requestId) return false;
  const parts = Object.fromEntries(
    sigHeader.split(",").map((p) => p.trim().split("=").map((s) => s.trim())),
  ) as Record<string, string>;
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum) || Math.abs(Date.now() - tsNum) > 5 * 60 * 1000) return false;
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

async function mpFetch(path: string): Promise<Record<string, unknown>> {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN!;
  const res = await fetch(`${MP_API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (!res.ok) throw new Error(`MP ${path}: ${JSON.stringify(data)}`);
  return data;
}

function mapPreapprovalStatus(s: string): "pending" | "authorized" | "cancelled" | "failed" {
  if (s === "authorized") return "authorized";
  if (s === "pending") return "pending";
  if (s === "cancelled" || s === "paused") return "cancelled";
  return "failed";
}

function mapPaymentStatus(s: string): "paid" | "pending" | "failed" {
  if (s === "approved") return "paid";
  if (s === "pending" || s === "in_process" || s === "authorized") return "pending";
  return "failed";
}

async function activateTenantPlan(tenantId: string, plan: string, periodDays = 30) {
  const periodEnd = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000).toISOString();
  const { data: tenant } = await supabaseAdmin
    .from("tenants")
    .select("plan, plan_status")
    .eq("id", tenantId)
    .maybeSingle();
  await supabaseAdmin
    .from("tenants")
    .update({ plan, plan_status: "active" })
    .eq("id", tenantId);
  if (tenant && tenant.plan !== plan) {
    // best-effort history (changed_by is required and NOT NULL; use a system uuid is not possible — skip if no super_admin)
    // Skipping history insert from webhook because changed_by must be a real user.
  }
  return periodEnd;
}

export const Route = createFileRoute("/api/public/mp/plan-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const topic = url.searchParams.get("type") ?? url.searchParams.get("topic");
        const idParam = url.searchParams.get("data.id") ?? url.searchParams.get("id");

        let resourceId: string | null = idParam;
        let bodyType: string | null = topic;
        try {
          const body = await request.clone().json();
          resourceId = resourceId ?? body?.data?.id?.toString() ?? null;
          bodyType = bodyType ?? body?.type ?? null;
        } catch {
          /* ignore */
        }

        if (!resourceId) return new Response("ignored", { status: 200 });
        if (!verifyMpSignature(request, resourceId)) {
          await logSecurityEvent({
            eventType: "payment.webhook.invalid_signature",
            severity: "warn",
            metadata: { provider: "mercadopago", flow: "plan", resourceId },
          });
          return new Response("invalid signature", { status: 401 });
        }


        try {
          if (bodyType === "preapproval" || bodyType === "subscription_preapproval") {
            // Dedup: preapproval can ping multiple times — skip if same status already recorded
            const pre = (await mpFetch(`/preapproval/${resourceId}`)) as {
              id: string;
              status: string;
              external_reference?: string;
              next_payment_date?: string;
              auto_recurring?: { transaction_amount?: number; currency_id?: string };
            };
            const ref = (pre.external_reference ?? "").split(":");
            const tenant_id = ref[0];
            const plan = ref[1];
            const status = mapPreapprovalStatus(pre.status);

            const { data: dupEvent } = await supabaseAdmin
              .from("plan_payment_events")
              .select("id, status")
              .eq("provider", "mercadopago")
              .eq("event_type", "preapproval")
              .eq("external_id", String(pre.id))
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            if (dupEvent && dupEvent.status === status) {
              return new Response("ok (duplicate)", { status: 200 });
            }

            const { data: sub } = await supabaseAdmin
              .from("tenant_subscriptions")
              .select("id, amount")
              .eq("mp_preapproval_id", String(pre.id))
              .maybeSingle();

            const subId = sub?.id;
            const periodEnd = pre.next_payment_date ?? null;

            // Validate transaction amount/currency for paid activations
            if (status === "authorized" && sub) {
              const expected = Number(sub.amount ?? 0);
              const received = Number(pre.auto_recurring?.transaction_amount ?? 0);
              const currency = pre.auto_recurring?.currency_id ?? "BRL";
              if (expected > 0 && (Math.abs(expected - received) > 0.01 || currency !== "BRL")) {
                await logSecurityEvent({
                  eventType: "payment.amount.mismatch",
                  severity: "critical",
                  tenantId: tenant_id || null,
                  metadata: {
                    provider: "mercadopago",
                    flow: "preapproval",
                    subscriptionId: subId,
                    expected,
                    received,
                    currency,
                  },
                });
                return new Response("amount mismatch", { status: 200 });
              }
            }


            if (subId) {
              await supabaseAdmin
                .from("tenant_subscriptions")
                .update({ status, current_period_end: periodEnd })
                .eq("id", subId);
            }

            if (status === "authorized" && tenant_id && plan) {
              await activateTenantPlan(tenant_id, plan);
              await logSecurityEvent({
                eventType: "payment.subscription.authorized",
                tenantId: tenant_id,
                metadata: { plan, subscriptionId: subId ?? null, preapprovalId: String(pre.id) },
              });
            } else if (status === "cancelled") {
              await logSecurityEvent({
                eventType: "payment.subscription.cancelled",
                tenantId: tenant_id || null,
                metadata: { plan, subscriptionId: subId ?? null, preapprovalId: String(pre.id) },
              });
            }

            await supabaseAdmin.from("plan_payment_events").insert({
              external_id: String(pre.id),
              event_type: "preapproval",
              tenant_id: tenant_id || null,
              subscription_id: subId ?? null,
              status,
              raw: JSON.parse(JSON.stringify(pre)),
            });
            return new Response("ok", { status: 200 });
          }


          if (bodyType === "payment") {
            const pay = (await mpFetch(`/v1/payments/${resourceId}`)) as {
              id: number;
              status: string;
              external_reference?: string;
              metadata?: Record<string, unknown>;
              preference_id?: string;
              transaction_amount?: number;
              currency_id?: string;
            };

            // Dedup by payment id
            const { data: dupPay } = await supabaseAdmin
              .from("plan_payment_events")
              .select("id")
              .eq("provider", "mercadopago")
              .eq("event_type", "payment")
              .eq("external_id", String(pay.id))
              .maybeSingle();
            if (dupPay) {
              return new Response("ok (duplicate)", { status: 200 });
            }

            const refParts = (pay.external_reference ?? "").split(":");
            const tenant_id = refParts[0];
            const plan = refParts[1];
            const status = mapPaymentStatus(pay.status);

            let subId: string | null = null;
            let subAmount = 0;
            if (pay.preference_id) {
              const { data: sub } = await supabaseAdmin
                .from("tenant_subscriptions")
                .select("id, amount")
                .eq("mp_preference_id", String(pay.preference_id))
                .maybeSingle();
              subId = sub?.id ?? null;
              subAmount = Number(sub?.amount ?? 0);
            }

            // Validate amount/currency for paid status
            if (status === "paid" && subAmount > 0) {
              const received = Number(pay.transaction_amount ?? 0);
              const currency = pay.currency_id ?? "BRL";
              if (Math.abs(subAmount - received) > 0.01 || currency !== "BRL") {
                await logSecurityEvent({
                  eventType: "payment.amount.mismatch",
                  severity: "critical",
                  tenantId: tenant_id || null,
                  metadata: {
                    provider: "mercadopago",
                    flow: "payment",
                    subscriptionId: subId,
                    expected: subAmount,
                    received,
                    currency,
                  },
                });
                return new Response("amount mismatch", { status: 200 });
              }
            }


            if (subId) {
              const update: { status: string; current_period_end?: string } = { status };
              if (status === "paid") {
                update.current_period_end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
              }
              await supabaseAdmin.from("tenant_subscriptions").update(update).eq("id", subId);
            }

            if (status === "paid" && tenant_id && plan && refParts.length >= 3) {
              await activateTenantPlan(tenant_id, plan);
              await logSecurityEvent({
                eventType: "payment.subscription.paid",
                tenantId: tenant_id,
                metadata: { plan, subscriptionId: subId, paymentId: String(pay.id) },
              });
            }

            await supabaseAdmin.from("plan_payment_events").insert({
              external_id: String(pay.id),
              event_type: "payment",
              tenant_id: tenant_id || null,
              subscription_id: subId,
              status,
              raw: JSON.parse(JSON.stringify(pay)),
            });
            return new Response("ok", { status: 200 });
          }


          return new Response("ignored", { status: 200 });
        } catch (e) {
          console.error("MP plan webhook error:", e);
          return new Response("error", { status: 500 });
        }

      },
    },
  },
});
