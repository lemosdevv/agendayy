import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const slugSchema = z.object({ slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/i) });

export const getTenantPublic = createServerFn({ method: "GET" })
  .inputValidator((d) => slugSchema.parse(d))
  .handler(async ({ data }) => {
    const { data: tenant, error } = await supabaseAdmin
      .from("tenants")
      .select("id, name, slug, business_type, is_active")
      .eq("slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!tenant) throw new Error("Negócio não encontrado");

    const [{ data: servicos }, { data: profissionais }, { data: unidades }] = await Promise.all([
      supabaseAdmin.from("servicos").select("id,nome,duracao_min,preco,cor,descricao").eq("tenant_id", tenant.id).eq("ativo", true).order("nome"),
      supabaseAdmin.from("profissionais").select("id,nome,cor").eq("tenant_id", tenant.id).eq("ativo", true).order("nome"),
      supabaseAdmin.from("unidades").select("id,nome,endereco").eq("tenant_id", tenant.id).eq("ativo", true).order("nome"),
    ]);

    return {
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, business_type: tenant.business_type },
      servicos: servicos ?? [],
      profissionais: profissionais ?? [],
      unidades: unidades ?? [],
    };
  });

export const getBusySlots = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({
      tenantId: z.string().uuid(),
      profissionalId: z.string().uuid(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    // Janela ampla (±1 dia) para cobrir qualquer timezone do cliente — o
    // filtro fino de overlap é feito no front com os horários locais reais.
    const dayMs = 24 * 60 * 60 * 1000;
    const base = new Date(`${data.date}T00:00:00Z`).getTime();
    const start = new Date(base - dayMs).toISOString();
    const end = new Date(base + 2 * dayMs).toISOString();
    const { data: rows, error } = await supabaseAdmin
      .from("agendamentos")
      .select("inicio,fim,status")
      .eq("tenant_id", data.tenantId)
      .eq("profissional_id", data.profissionalId)
      .gte("inicio", start)
      .lte("inicio", end);
    if (error) throw new Error(error.message);
    return (rows ?? []).filter((r) => r.status !== "cancelado" && r.status !== "faltou");
  });

export const createPublicBooking = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      tenantId: z.string().uuid(),
      servicoId: z.string().uuid(),
      profissionalId: z.string().uuid(),
      unidadeId: z.string().uuid().optional().nullable(),
      inicio: z.string(),
      cliente: z.object({
        nome: z.string().min(2).max(120),
        telefone: z.string().min(8).max(20),
        email: z.string().email().optional().or(z.literal("")).nullable(),
        observacoes: z.string().max(500).optional().nullable(),
      }),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    // fetch service for duration + price
    const { data: servico, error: sErr } = await supabaseAdmin
      .from("servicos")
      .select("id,duracao_min,preco,tenant_id,ativo")
      .eq("id", data.servicoId)
      .maybeSingle();
    if (sErr || !servico || servico.tenant_id !== data.tenantId || !servico.ativo) {
      throw new Error("Serviço inválido");
    }

    // Verify profissional belongs to the same tenant and is active
    const { data: prof } = await supabaseAdmin
      .from("profissionais")
      .select("id")
      .eq("id", data.profissionalId)
      .eq("tenant_id", data.tenantId)
      .eq("ativo", true)
      .maybeSingle();
    if (!prof) throw new Error("Profissional inválido");

    // Verify unidade (if provided) belongs to the same tenant
    if (data.unidadeId) {
      const { data: uni } = await supabaseAdmin
        .from("unidades")
        .select("id")
        .eq("id", data.unidadeId)
        .eq("tenant_id", data.tenantId)
        .maybeSingle();
      if (!uni) throw new Error("Unidade inválida");
    }
    const inicio = new Date(data.inicio);
    if (Number.isNaN(inicio.getTime())) throw new Error("Data inválida");
    if (inicio.getTime() < Date.now() - 60_000) throw new Error("Não é possível agendar no passado");
    const fim = new Date(inicio.getTime() + servico.duracao_min * 60_000);

    // find or create cliente by phone within tenant
    const phone = data.cliente.telefone.trim();
    const { data: existing } = await supabaseAdmin
      .from("clientes")
      .select("id")
      .eq("tenant_id", data.tenantId)
      .eq("telefone", phone)
      .maybeSingle();

    let clienteId = existing?.id as string | undefined;
    if (!clienteId) {
      const { data: inserted, error: cErr } = await supabaseAdmin
        .from("clientes")
        .insert({
          tenant_id: data.tenantId,
          nome: data.cliente.nome,
          telefone: phone,
          email: data.cliente.email || null,
        })
        .select("id")
        .single();
      if (cErr) throw new Error(cErr.message);
      clienteId = inserted.id;
    }

    const { data: ag, error: aErr } = await supabaseAdmin
      .from("agendamentos")
      .insert({
        tenant_id: data.tenantId,
        cliente_id: clienteId,
        servico_id: data.servicoId,
        profissional_id: data.profissionalId,
        unidade_id: data.unidadeId ?? null,
        inicio: inicio.toISOString(),
        fim: fim.toISOString(),
        preco: servico.preco,
        observacoes: data.cliente.observacoes || null,
        status: "pendente",
      })
      .select("id")
      .single();
    if (aErr) throw new Error(aErr.message.includes("Conflito") ? "Horário indisponível, escolha outro." : aErr.message);

    return { id: ag.id };
  });
