
-- Fix #1: PRIVILEGE ESCALATION — drop permissive user_roles INSERT policy
-- Role assignment happens exclusively via SECURITY DEFINER function complete_onboarding
DROP POLICY IF EXISTS "Users insert own role on signup" ON public.user_roles;

-- Fix #2: Tighten SELECT policies — require explicit role membership in tenant,
-- not just a matching profile.tenant_id (which a user could manipulate)
CREATE OR REPLACE FUNCTION public.is_tenant_member(_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND tenant_id = _tenant_id
  )
$$;

-- Replace SELECT policies on tenant-scoped tables
DROP POLICY IF EXISTS select_tenant_clientes ON public.clientes;
CREATE POLICY select_tenant_clientes ON public.clientes
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS select_tenant_profissionais ON public.profissionais;
CREATE POLICY select_tenant_profissionais ON public.profissionais
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS select_tenant_agendamentos ON public.agendamentos;
CREATE POLICY select_tenant_agendamentos ON public.agendamentos
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS select_tenant_servicos ON public.servicos;
CREATE POLICY select_tenant_servicos ON public.servicos
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS select_tenant_unidades ON public.unidades;
CREATE POLICY select_tenant_unidades ON public.unidades
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS select_tenant_prof_serv ON public.profissional_servicos;
CREATE POLICY select_tenant_prof_serv ON public.profissional_servicos
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS select_tenant_prof_unid ON public.profissional_unidades;
CREATE POLICY select_tenant_prof_unid ON public.profissional_unidades
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

-- Fix #5: payment_events — explicit deny for clients; service role bypasses RLS for webhook writes
CREATE POLICY no_client_access_payment_events ON public.payment_events
  FOR SELECT TO authenticated
  USING (false);

-- Fix SUPA linter: revoke EXECUTE on SECURITY DEFINER complete_onboarding
-- (now superseded by the server function that uses supabaseAdmin)
REVOKE EXECUTE ON FUNCTION public.complete_onboarding(text, text, business_type, text) FROM anon, authenticated, public;
