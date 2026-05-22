-- 1) Revoke EXECUTE on trigger-only SECURITY DEFINER functions from everyone.
-- Triggers run as table owner; users never need to call these directly.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_agendamento_conflito() FROM PUBLIC, anon, authenticated;

-- 2) Revoke EXECUTE from anon for RLS helper functions (only authenticated users
-- need them to evaluate policies; anon evaluation always returns false anyway).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_tenant_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_manage(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_tenant_member(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC, anon;

-- 3) RPCs invoked from the client by signed-in users only.
REVOKE EXECUTE ON FUNCTION public.complete_onboarding(text, text, public.business_type, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_tenant_slug(text) FROM PUBLIC, anon;

-- 4) Tighten "manage_*" RLS policies that today target the `public` role
-- (which includes anon). The USING clause already calls auth.uid() helpers
-- so anon was effectively blocked, but explicitly scoping to `authenticated`
-- removes any chance of misconfiguration.

DROP POLICY IF EXISTS "manage_agendamentos" ON public.agendamentos;
CREATE POLICY "manage_agendamentos" ON public.agendamentos
  AS PERMISSIVE FOR ALL TO authenticated
  USING (can_manage(tenant_id)) WITH CHECK (can_manage(tenant_id));

DROP POLICY IF EXISTS "manage_clientes" ON public.clientes;
CREATE POLICY "manage_clientes" ON public.clientes
  AS PERMISSIVE FOR ALL TO authenticated
  USING (can_manage(tenant_id)) WITH CHECK (can_manage(tenant_id));

DROP POLICY IF EXISTS "manage_servicos" ON public.servicos;
CREATE POLICY "manage_servicos" ON public.servicos
  AS PERMISSIVE FOR ALL TO authenticated
  USING (can_manage(tenant_id)) WITH CHECK (can_manage(tenant_id));

DROP POLICY IF EXISTS "manage_profissionais" ON public.profissionais;
CREATE POLICY "manage_profissionais" ON public.profissionais
  AS PERMISSIVE FOR ALL TO authenticated
  USING (can_manage(tenant_id)) WITH CHECK (can_manage(tenant_id));

DROP POLICY IF EXISTS "manage_unidades" ON public.unidades;
CREATE POLICY "manage_unidades" ON public.unidades
  AS PERMISSIVE FOR ALL TO authenticated
  USING (can_manage(tenant_id)) WITH CHECK (can_manage(tenant_id));

DROP POLICY IF EXISTS "manage_prof_serv" ON public.profissional_servicos;
CREATE POLICY "manage_prof_serv" ON public.profissional_servicos
  AS PERMISSIVE FOR ALL TO authenticated
  USING (can_manage(tenant_id)) WITH CHECK (can_manage(tenant_id));

DROP POLICY IF EXISTS "manage_prof_unid" ON public.profissional_unidades;
CREATE POLICY "manage_prof_unid" ON public.profissional_unidades
  AS PERMISSIVE FOR ALL TO authenticated
  USING (can_manage(tenant_id)) WITH CHECK (can_manage(tenant_id));

-- 5) google_calendar_tokens contém refresh_token sensível.
DROP POLICY IF EXISTS "users manage own google tokens" ON public.google_calendar_tokens;
CREATE POLICY "users manage own google tokens" ON public.google_calendar_tokens
  AS PERMISSIVE FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());