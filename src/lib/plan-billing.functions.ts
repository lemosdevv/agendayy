import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { randomUUID } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";


const MP_API = "https://api.mercadopago.com";

const PLAN_PRICES: Record<string, { amount: number; label: string }> = {
  start: { amount: 29.99, label: "Plano Start Agenday" },
  profissional: { amount: 49.99, label: "Plano Profissional Agenday" },
  studio: { amount: 109.99, label: "Plano Studio Agenday" },
};

function getBaseUrl(): string {
  const explicit = process.env.PUBLIC_BASE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  return "https://project--9cc3364d-9527-4f85-bd61-2a6ab765f1ad.lovable.app";
}

async function assertOwner(userId: string): Promise<{ tenant_id: string; email: string }> {
  const { data: profile, error: pErr } = await supabaseAdmin
    .from("profiles")
    .select("tenant_id, email")
    .eq("id", userId)
    .maybeSingle();
  if (pErr) throw pErr;
  if (!profile?.tenant_id) throw new Error("Sem estabelecimento vinculado");
  const { data: role } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("tenant_id", profile.tenant_id)
    .eq("role", "owner")
    .maybeSingle();
  if (!role) throw new Error("Apenas o dono do estabelecimento pode contratar planos");
  return { tenant_id: profile.tenant_id, email: profile.email ?? "" };
}

// Public key (safe to expose to the browser) — fetched by the embedded checkout.
export const getMpPublicKey = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const pk = process.env.MERCADO_PAGO_PUBLIC_KEY;
    if (!pk) throw new Error("MERCADO_PAGO_PUBLIC_KEY não configurado");
    return { publicKey: pk };
  });

// Cartão recorrente: recebe um card_token gerado no front pelo SDK do MP
// e cria o preapproval (assinatura) com status authorized — cobra na hora.
export const subscribeWithCardToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      plan: z.enum(["start", "profissional", "studio"]),
      cardToken: z.string().min(10),
      payerEmail: z.string().email(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!token) throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado");

    const { userId } = context;
    const { tenant_id } = await assertOwner(userId);
    const plan = PLAN_PRICES[data.plan];
    const baseUrl = getBaseUrl();

    const idempotencyKey = randomUUID();

    const body: Record<string, unknown> = {
      reason: plan.label,
      external_reference: `${tenant_id}:${data.plan}`,
      payer_email: data.payerEmail,
      card_token_id: data.cardToken,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: plan.amount,
        currency_id: "BRL",
      },
      back_url: `${baseUrl}/app/pagamentos`,
      status: "authorized",
    };
    if (baseUrl.startsWith("https://")) {
      body.notification_url = `${baseUrl}/api/public/mp/plan-webhook`;
    }

    const res = await fetch(`${MP_API}/preapproval`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(body),
    });
    const result = await res.json();
    if (!res.ok) {
      console.error("MP preapproval error: status=" + res.status);
      const detail = result?.cause?.[0]?.description || result?.error || result?.message || "Falha ao processar pagamento";
      throw new Error(`Mercado Pago: ${detail}`);
    }

    await supabaseAdmin.from("tenant_subscriptions").insert({
      tenant_id,
      plan: data.plan,
      mode: "recurring",
      mp_preapproval_id: String(result.id),
      mp_payer_email: data.payerEmail,
      amount: plan.amount,
      status: result.status === "authorized" ? "authorized" : "pending",
      created_by: userId,
      idempotency_key: idempotencyKey,
    });

    return { id: String(result.id), status: String(result.status) };
  });


// Pix avulso: cria pagamento direto via /v1/payments e devolve QR Code + copia-e-cola.
export const createPixPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      plan: z.enum(["start", "profissional", "studio"]),
      payerEmail: z.string().email(),
      payerFirstName: z.string().min(1).max(80).optional(),
      payerLastName: z.string().min(1).max(80).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!token) throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado");

    const { userId } = context;
    const { tenant_id } = await assertOwner(userId);
    const plan = PLAN_PRICES[data.plan];
    const baseUrl = getBaseUrl();
    const period = new Date().toISOString().slice(0, 7);
    const idempotencyKey = `pix-${tenant_id}-${data.plan}-${period}`;

    // If we already created a pending Pix for this tenant/plan/month, reuse it
    // instead of charging again.
    const { data: existing } = await supabaseAdmin
      .from("tenant_subscriptions")
      .select("id, status, mp_preference_id")
      .eq("tenant_id", tenant_id)
      .eq("plan", data.plan)
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (existing && existing.status === "paid") {
      return { id: existing.mp_preference_id ?? "", status: "paid", qrBase64: null, qrCode: null, ticketUrl: null };
    }

    const body: Record<string, unknown> = {
      transaction_amount: plan.amount,
      description: `${plan.label} — ${period}`,
      payment_method_id: "pix",
      external_reference: `${tenant_id}:${data.plan}:${period}`,
      payer: {
        email: data.payerEmail,
        first_name: data.payerFirstName ?? "Cliente",
        last_name: data.payerLastName ?? "Agenday",
      },
    };
    if (baseUrl.startsWith("https://")) {
      body.notification_url = `${baseUrl}/api/public/mp/plan-webhook`;
    }

    const res = await fetch(`${MP_API}/v1/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(body),
    });
    const result = await res.json();
    if (!res.ok) {
      console.error("MP pix error: status=" + res.status);
      const detail = result?.cause?.[0]?.description || result?.error || result?.message || "Falha ao gerar Pix";
      throw new Error(`Mercado Pago (Pix): ${detail}`);
    }

    const qrBase64 = result?.point_of_interaction?.transaction_data?.qr_code_base64 ?? null;
    const qrCode = result?.point_of_interaction?.transaction_data?.qr_code ?? null;
    const ticketUrl = result?.point_of_interaction?.transaction_data?.ticket_url ?? null;

    if (!existing) {
      await supabaseAdmin.from("tenant_subscriptions").insert({
        tenant_id,
        plan: data.plan,
        mode: "one_time",
        mp_preference_id: String(result.id),
        mp_payer_email: data.payerEmail,
        amount: plan.amount,
        status: "pending",
        created_by: userId,
        idempotency_key: idempotencyKey,
      });
    } else {
      await supabaseAdmin
        .from("tenant_subscriptions")
        .update({ mp_preference_id: String(result.id) })
        .eq("id", existing.id);
    }

    return {
      id: String(result.id),
      status: String(result.status),
      qrBase64,
      qrCode,
      ticketUrl,
    };
  });


export const getMySubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .maybeSingle();
    if (!profile?.tenant_id) return null;
    const { data } = await supabase
      .from("tenant_subscriptions")
      .select("id, plan, mode, status, amount, current_period_end, created_at")
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  });
