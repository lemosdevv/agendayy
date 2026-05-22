import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    const [todayAg, monthAg, clientes, servicos, nextAg] = await Promise.all([
      supabase.from("agendamentos").select("id,status,preco,inicio,cliente_id,servico_id,profissional_id", { count: "exact" }).gte("inicio", startOfDay).lt("inicio", endOfDay).order("inicio"),
      supabase.from("agendamentos").select("preco,status").gte("inicio", startOfMonth).lt("inicio", endOfMonth),
      supabase.from("clientes").select("id", { count: "exact", head: true }),
      supabase.from("servicos").select("id", { count: "exact", head: true }).eq("ativo", true),
      supabase.from("agendamentos").select("id,inicio,cliente_id,servico_id").gte("inicio", new Date().toISOString()).order("inicio").limit(5),
    ]);

    const receitaMes = (monthAg.data ?? [])
      .filter((a) => a.status === "concluido" || a.status === "confirmado")
      .reduce((acc, a) => acc + Number(a.preco ?? 0), 0);

    return {
      agendamentosHoje: todayAg.count ?? 0,
      agendamentosHojeList: todayAg.data ?? [],
      totalClientes: clientes.count ?? 0,
      servicosAtivos: servicos.count ?? 0,
      receitaMes,
      proximos: nextAg.data ?? [],
    };
  });

export const getReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { data: ags } = await supabase
      .from("agendamentos")
      .select("inicio,preco,status,servico_id,profissional_id")
      .gte("inicio", since.toISOString())
      .order("inicio");

    const rows = ags ?? [];
    const concluidos = rows.filter((r) => r.status === "concluido");
    const cancelados = rows.filter((r) => r.status === "cancelado");
    const faltas = rows.filter((r) => r.status === "faltou");
    const receita = concluidos.reduce((acc, r) => acc + Number(r.preco ?? 0), 0);

    // by day
    const byDay = new Map<string, { count: number; receita: number }>();
    for (const r of rows) {
      const d = r.inicio.slice(0, 10);
      const cur = byDay.get(d) ?? { count: 0, receita: 0 };
      cur.count += 1;
      if (r.status === "concluido") cur.receita += Number(r.preco ?? 0);
      byDay.set(d, cur);
    }
    const serie = Array.from(byDay.entries()).map(([d, v]) => ({ data: d, ...v }));

    return {
      total: rows.length,
      concluidos: concluidos.length,
      cancelados: cancelados.length,
      faltas: faltas.length,
      receita,
      ticketMedio: concluidos.length ? receita / concluidos.length : 0,
      serie,
    };
  });
