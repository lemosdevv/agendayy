import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BUSINESS_TYPES = [
  "lash_designer",
  "nail_designer",
  "manicure",
  "sobrancelhas",
  "estetica",
  "salao_beleza",
  "studio_beleza",
  "cabeleireiro",
  "outro",
] as const;

const onboardingSchema = z.object({
  // Step 1 — Empresa
  name: z.string().trim().min(1, "Informe o nome da empresa").max(120),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
  businessType: z.enum(BUSINESS_TYPES),
  whatsapp: z.string().trim().min(1).max(40),
  professionalsCount: z.string().trim().min(1).max(40),
  cnpj: z.string().trim().max(30).optional().nullable(),
  instagram: z.string().trim().max(60).optional().nullable(),
  // Step 2 — Endereço
  address: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(120),
  state: z.string().trim().min(1).max(60),
  // Step 3 — Expediente
  workingDays: z.array(z.string()).min(1, "Selecione ao menos um dia"),
  workingHours: z.string().trim().min(1).max(200),
  // Step 4 — Design
  logoUrl: z.string().trim().max(500).optional().nullable(),
  // Step 5 — WhatsApp settings
  whatsappSettings: z.object({
    reminder24h: z.boolean(),
    reminder1h: z.boolean(),
    followup30d: z.boolean(),
    followup60d: z.boolean(),
    followup90d: z.boolean(),
    notifyNew: z.boolean(),
    notifyCancel: z.boolean(),
  }),
  // Step 6 — Dados pessoais
  fullName: z.string().trim().min(1).max(120),
  ownerWhatsapp: z.string().trim().min(1).max(40),
  email: z.string().trim().email().max(160),
  cpf: z.string().trim().min(1).max(20),
});

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => onboardingSchema.parse(input))
  .handler(async ({ data, context }) => {
    const userId = context.userId;

    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("tenant_id,onboarded")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) throw profileError;
    if (existingProfile?.tenant_id && existingProfile.onboarded) {
      return { tenantId: existingProfile.tenant_id };
    }

    const slug = `${data.slug}-${userId.slice(0, 8)}`;
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .insert({
        name: data.name,
        slug,
        business_type: data.businessType,
        whatsapp: data.whatsapp,
        instagram: data.instagram || null,
        cnpj: data.cnpj || null,
        professionals_count: data.professionalsCount,
        address: data.address,
        city: data.city,
        state: data.state,
        working_days: data.workingDays,
        working_hours: data.workingHours,
        logo_url: data.logoUrl || null,
        whatsapp_settings: data.whatsappSettings,
      })
      .select("id")
      .single();

    if (tenantError) throw tenantError;

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, tenant_id: tenant.id, role: "owner" });

    if (roleError) throw roleError;

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        tenant_id: tenant.id,
        full_name: data.fullName,
        email: data.email,
        phone: data.ownerWhatsapp,
        cpf: data.cpf,
        onboarded: true,
      })
      .eq("id", userId);

    if (updateError) throw updateError;

    return { tenantId: tenant.id };
  });
