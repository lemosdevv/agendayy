import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSuperAdmin } from "./admin-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { maskEmail, maskPhone, maskId, planPrice } from "./admin-utils";

// ---------- Audit helper ----------
async function audit(actor: string, action: string, targetType: string, targetId: string | null, metadata: Record<string, unknown> = {}) {
  await supabaseAdmin.from("admin_audit_log").insert({
    actor_user_id: actor,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata: metadata as never,
  });
}

// ---------- Verify super admin role (used by guard route) ----------
export const verifyAdminAccess = createServerFn({ method: "GET" })
  .middleware([requireSuperAdmin])
  .handler(async ({ context }) => {
    return { ok: true as const, userId: context.userId };
  });

// ---------- Metrics ----------
export const getAdminMetrics = createServerFn({ method: "GET" })
  .middleware([requireSuperAdmin])
  .handler(async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [profilesAll, profilesOnboarded, tenantsAll, tenantsActive, tenantsCanceled, newUsersMonth, canceledMonth, agendThisMonth] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("onboarded", true),
      supabaseAdmin.from("tenants").select("id, plan, plan_status, is_active"),
      supabaseAdmin.from("tenants").select("id", { count: "exact", head: true }).eq("is_active", true).eq("plan_status", "active"),
      supabaseAdmin.from("tenants").select("id", { count: "exact", head: true }).eq("plan_status", "canceled"),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", startOfMonth),
      supabaseAdmin.from("tenant_plan_history").select("id", { count: "exact", head: true }).eq("new_status", "canceled").gte("created_at", startOfMonth),
      supabaseAdmin.from("agendamentos").select("id", { count: "exact", head: true }).gte("created_at", startOfMonth),
    ]);

    const tenants = tenantsAll.data ?? [];
    const mrr = tenants
      .filter((t) => t.is_active && t.plan_status === "active")
      .reduce((sum, t) => sum + planPrice(t.plan), 0);

    return {
      totalUsers: profilesAll.count ?? 0,
      activeUsers: profilesOnboarded.count ?? 0,
      inactiveUsers: (profilesAll.count ?? 0) - (profilesOnboarded.count ?? 0),
      activeSubscriptions: tenantsActive.count ?? 0,
      canceledSubscriptions: tenantsCanceled.count ?? 0,
      mrr,
      newUsersThisMonth: newUsersMonth.count ?? 0,
      cancellationsThisMonth: canceledMonth.count ?? 0,
      appointmentsThisMonth: agendThisMonth.count ?? 0,
    };
  });

// ---------- Users list ----------
const listUsersSchema = z.object({
  search: z.string().max(120).optional(),
  plan: z.string().max(40).optional(),
  status: z.enum(["all", "active", "inactive"]).default("all"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(10).max(100).default(25),
});

export const listAdminUsers = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((input: unknown) => listUsersSchema.parse(input))
  .handler(async ({ data }) => {
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;

    let q = supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, phone, onboarded, tenant_id, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (data.search) {
      const s = data.search.replace(/[%_]/g, "");
      q = q.or(`full_name.ilike.%${s}%,email.ilike.%${s}%`);
    }
    if (data.status === "active") q = q.eq("onboarded", true);
    if (data.status === "inactive") q = q.eq("onboarded", false);

    const { data: profiles, error, count } = await q;
    if (error) throw new Error(error.message);

    // Fetch tenants for the listed profiles
    const tenantIds = Array.from(new Set((profiles ?? []).map((p) => p.tenant_id).filter(Boolean))) as string[];
    const { data: tenants } = tenantIds.length
      ? await supabaseAdmin.from("tenants").select("id, name, plan, plan_status, is_active").in("id", tenantIds)
      : { data: [] as Array<{ id: string; name: string; plan: string; plan_status: string; is_active: boolean }> };

    const tenantMap = new Map((tenants ?? []).map((t) => [t.id, t]));

    let rows = (profiles ?? []).map((p) => {
      const t = p.tenant_id ? tenantMap.get(p.tenant_id) : null;
      return {
        id: p.id,
        fullName: p.full_name ?? "—",
        email: maskEmail(p.email),
        phone: maskPhone(p.phone),
        createdAt: p.created_at,
        accountActive: p.onboarded,
        tenantName: t?.name ?? "—",
        plan: t?.plan ?? "—",
        subscriptionStatus: t?.plan_status ?? "—",
      };
    });

    if (data.plan && data.plan !== "all") {
      rows = rows.filter((r) => r.plan === data.plan);
    }

    return { rows, total: count ?? 0, page: data.page, pageSize: data.pageSize };
  });

// ---------- User detail ----------
export const getAdminUserDetail = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((input: unknown) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: profile } = await supabaseAdmin.from("profiles").select("*").eq("id", data.userId).maybeSingle();
    if (!profile) throw new Error("Usuário não encontrado");

    const { data: roles } = await supabaseAdmin.from("user_roles").select("role, tenant_id").eq("user_id", data.userId);
    const { data: tenant } = profile.tenant_id
      ? await supabaseAdmin.from("tenants").select("*").eq("id", profile.tenant_id).maybeSingle()
      : { data: null };

    const { data: recentAppts } = profile.tenant_id
      ? await supabaseAdmin
          .from("agendamentos")
          .select("id, inicio, fim, status, preco, pagamento_status, pagamento_id")
          .eq("tenant_id", profile.tenant_id)
          .order("inicio", { ascending: false })
          .limit(10)
      : { data: [] };

    return {
      profile: {
        id: profile.id,
        fullName: profile.full_name,
        email: profile.email, // full email visible only on detail (admin needs it)
        phone: profile.phone,
        onboarded: profile.onboarded,
        createdAt: profile.created_at,
      },
      roles: roles ?? [],
      tenant: tenant
        ? {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            plan: tenant.plan,
            planStatus: tenant.plan_status,
            isActive: tenant.is_active,
            createdAt: tenant.created_at,
            trialStart: tenant.trial_start_date,
          }
        : null,
      recentAppointments: (recentAppts ?? []).map((a) => ({
        id: a.id,
        inicio: a.inicio,
        fim: a.fim,
        status: a.status,
        preco: Number(a.preco),
        pagamentoStatus: a.pagamento_status,
        pagamentoIdMasked: maskId(a.pagamento_id, 6),
      })),
    };
  });

// ---------- Tenants/Subscriptions list ----------
const listTenantsSchema = z.object({
  search: z.string().max(120).optional(),
  plan: z.string().max(40).optional(),
  status: z.string().max(40).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(10).max(100).default(25),
});

export const listAdminTenants = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((input: unknown) => listTenantsSchema.parse(input))
  .handler(async ({ data }) => {
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;

    let q = supabaseAdmin
      .from("tenants")
      .select("id, name, slug, plan, plan_status, is_active, created_at, trial_start_date", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (data.search) {
      const s = data.search.replace(/[%_]/g, "");
      q = q.or(`name.ilike.%${s}%,slug.ilike.%${s}%`);
    }
    if (data.plan && data.plan !== "all") q = q.eq("plan", data.plan);
    if (data.status && data.status !== "all") q = q.eq("plan_status", data.status);

    const { data: tenants, error, count } = await q;
    if (error) throw new Error(error.message);

    // Fetch owners
    const tIds = (tenants ?? []).map((t) => t.id);
    const { data: owners } = tIds.length
      ? await supabaseAdmin.from("user_roles").select("tenant_id, user_id").in("tenant_id", tIds).eq("role", "owner")
      : { data: [] };
    const ownerIds = (owners ?? []).map((o) => o.user_id);
    const { data: ownerProfiles } = ownerIds.length
      ? await supabaseAdmin.from("profiles").select("id, full_name, email").in("id", ownerIds)
      : { data: [] };
    const profMap = new Map((ownerProfiles ?? []).map((p) => [p.id, p]));
    const tenantOwner = new Map<string, { fullName: string; email: string }>();
    for (const o of owners ?? []) {
      if (!o.tenant_id) continue;
      const p = profMap.get(o.user_id);
      if (p) tenantOwner.set(o.tenant_id, { fullName: p.full_name ?? "—", email: maskEmail(p.email) });
    }

    const rows = (tenants ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      plan: t.plan,
      planStatus: t.plan_status,
      isActive: t.is_active,
      createdAt: t.created_at,
      trialStartDate: t.trial_start_date,
      mrr: planPrice(t.plan),
      owner: tenantOwner.get(t.id) ?? { fullName: "—", email: "—" },
    }));

    return { rows, total: count ?? 0, page: data.page, pageSize: data.pageSize };
  });

// ---------- Update tenant (subscription actions) ----------
const updateTenantSchema = z.object({
  tenantId: z.string().uuid(),
  action: z.enum(["cancel", "reactivate", "change_plan"]),
  plan: z.string().max(40).optional(),
  reason: z.string().max(500).optional(),
});

export const updateTenantSubscription = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((input: unknown) => updateTenantSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: current } = await supabaseAdmin.from("tenants").select("plan, plan_status, is_active").eq("id", data.tenantId).maybeSingle();
    if (!current) throw new Error("Estabelecimento não encontrado");

    let newPlan = current.plan;
    let newStatus = current.plan_status;
    let newActive = current.is_active;

    if (data.action === "cancel") { newStatus = "canceled"; newActive = false; }
    if (data.action === "reactivate") { newStatus = "active"; newActive = true; }
    if (data.action === "change_plan") {
      if (!data.plan) throw new Error("Plano obrigatório");
      newPlan = data.plan;
    }

    const { error } = await supabaseAdmin
      .from("tenants")
      .update({ plan: newPlan, plan_status: newStatus, is_active: newActive })
      .eq("id", data.tenantId);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("tenant_plan_history").insert({
      tenant_id: data.tenantId,
      previous_plan: current.plan,
      new_plan: newPlan,
      previous_status: current.plan_status,
      new_status: newStatus,
      changed_by: context.userId,
      reason: data.reason ?? null,
    });

    await audit(context.userId, `tenant.${data.action}`, "tenant", data.tenantId, {
      from: { plan: current.plan, status: current.plan_status },
      to: { plan: newPlan, status: newStatus },
    });

    return { ok: true };
  });

// ---------- Set user active/inactive ----------
export const setUserActive = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid(), active: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ onboarded: data.active })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    await audit(context.userId, data.active ? "user.activate" : "user.deactivate", "user", data.userId, {});
    return { ok: true };
  });

// ---------- Charts ----------
export const getAdminCharts = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((input: unknown) =>
    z.object({ period: z.enum(["30d", "90d", "12m"]).default("90d") }).parse(input),
  )
  .handler(async ({ data }) => {
    const now = new Date();
    const start = new Date();
    if (data.period === "30d") start.setDate(now.getDate() - 30);
    else if (data.period === "90d") start.setDate(now.getDate() - 90);
    else start.setMonth(now.getMonth() - 12);

    const [{ data: profiles }, { data: tenants }, { data: cancellations }] = await Promise.all([
      supabaseAdmin.from("profiles").select("created_at").gte("created_at", start.toISOString()),
      supabaseAdmin.from("tenants").select("created_at, plan, plan_status, is_active"),
      supabaseAdmin.from("tenant_plan_history").select("created_at, new_status").gte("created_at", start.toISOString()),
    ]);

    const bucketKey = (d: Date) =>
      data.period === "12m"
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        : d.toISOString().slice(0, 10);

    const userGrowth = new Map<string, number>();
    for (const p of profiles ?? []) {
      const k = bucketKey(new Date(p.created_at));
      userGrowth.set(k, (userGrowth.get(k) ?? 0) + 1);
    }

    const churn = new Map<string, number>();
    for (const c of cancellations ?? []) {
      if (c.new_status !== "canceled") continue;
      const k = bucketKey(new Date(c.created_at));
      churn.set(k, (churn.get(k) ?? 0) + 1);
    }

    const newCustomers = new Map<string, number>();
    for (const t of tenants ?? []) {
      const created = new Date(t.created_at);
      if (created < start) continue;
      const k = bucketKey(created);
      newCustomers.set(k, (newCustomers.get(k) ?? 0) + 1);
    }

    // Revenue per bucket (estimated): tenants created up to that bucket × planPrice (active only).
    // Simpler: current MRR per plan distribution (pie). For the bar chart, sum monthly MRR for last N months.
    const activeVsCanceled = [
      { name: "Ativas", value: (tenants ?? []).filter((t) => t.plan_status === "active" && t.is_active).length },
      { name: "Canceladas", value: (tenants ?? []).filter((t) => t.plan_status === "canceled").length },
      { name: "Trial", value: (tenants ?? []).filter((t) => t.plan === "trial").length },
    ];

    const revenuePerBucket = new Map<string, number>();
    for (const t of tenants ?? []) {
      const created = new Date(t.created_at);
      if (created < start) continue;
      if (t.plan_status !== "active" || !t.is_active) continue;
      const k = bucketKey(created);
      revenuePerBucket.set(k, (revenuePerBucket.get(k) ?? 0) + planPrice(t.plan));
    }

    const toSeries = (m: Map<string, number>) =>
      Array.from(m.entries())
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([date, value]) => ({ date, value }));

    return {
      userGrowth: toSeries(userGrowth),
      churn: toSeries(churn),
      newCustomers: toSeries(newCustomers),
      revenue: toSeries(revenuePerBucket),
      activeVsCanceled,
    };
  });

// ---------- Audit log ----------
export const listAuditLog = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((input: unknown) =>
    z.object({ page: z.number().int().min(1).default(1), pageSize: z.number().int().min(10).max(100).default(50) }).parse(input),
  )
  .handler(async ({ data }) => {
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    const { data: rows, count } = await supabaseAdmin
      .from("admin_audit_log")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    const actorIds = Array.from(new Set((rows ?? []).map((r) => r.actor_user_id)));
    const { data: actors } = actorIds.length
      ? await supabaseAdmin.from("profiles").select("id, full_name, email").in("id", actorIds)
      : { data: [] };
    const actorMap = new Map((actors ?? []).map((a) => [a.id, a]));

    return {
      rows: (rows ?? []).map((r) => ({
        id: r.id,
        action: r.action,
        targetType: r.target_type,
        targetId: r.target_id,
        metadata: r.metadata,
        createdAt: r.created_at,
        actor: actorMap.get(r.actor_user_id)
          ? {
              fullName: actorMap.get(r.actor_user_id)!.full_name ?? "—",
              email: maskEmail(actorMap.get(r.actor_user_id)!.email),
            }
          : { fullName: "—", email: "—" },
      })),
      total: count ?? 0,
      page: data.page,
      pageSize: data.pageSize,
    };
  });
