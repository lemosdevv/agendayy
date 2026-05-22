import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MP_API = "https://api.mercadopago.com";

function getBaseUrl(): string {
  const explicit = process.env.PUBLIC_BASE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  return "https://project--9cc3364d-9527-4f85-bd61-2a6ab765f1ad.lovable.app";
}

export const createMpPaymentLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ agendamento_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!token) throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado");

    const { supabase } = context;
    const { data: ag, error } = await supabase
      .from("agendamentos")
      .select("id,preco,inicio,cliente:clientes(nome,email),servico:servicos(nome)")
      .eq("id", data.agendamento_id)
      .maybeSingle();
    if (error) throw error;
    if (!ag) throw new Error("Agendamento não encontrado");
    if (!ag.preco || Number(ag.preco) <= 0) throw new Error("Agendamento sem preço definido");

    const cliente = ag.cliente as { nome: string; email: string | null } | null;
    const servico = (ag.servico as { nome: string } | null)?.nome ?? "Agendamento";
    const baseUrl = getBaseUrl();

    const preference = {
      items: [
        {
          title: servico,
          quantity: 1,
          unit_price: Number(ag.preco),
          currency_id: "BRL",
        },
      ],
      ...(cliente?.email ? { payer: { name: cliente.nome, email: cliente.email } } : {}),
      external_reference: ag.id,
      notification_url: `${baseUrl}/api/public/mp/webhook`,
      back_urls: {
        success: `${baseUrl}/app/agenda?pagamento=ok`,
        failure: `${baseUrl}/app/agenda?pagamento=erro`,
        pending: `${baseUrl}/app/agenda?pagamento=pendente`,
      },
      auto_return: "approved",
    };

    const res = await fetch(`${MP_API}/checkout/preferences`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(preference),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(`Mercado Pago: ${JSON.stringify(result)}`);

    const link = result.init_point as string;
    await supabase
      .from("agendamentos")
      .update({ pagamento_link: link, pagamento_id: result.id, pagamento_status: "aguardando" })
      .eq("id", ag.id);

    return { link, preferenceId: result.id as string };
  });

export async function fetchMpPayment(paymentId: string): Promise<{
  id: number;
  status: string;
  external_reference: string | null;
}> {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN!;
  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`MP fetch payment: ${JSON.stringify(data)}`);
  return data;
}
