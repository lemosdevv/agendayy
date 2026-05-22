
-- 1. Função para checar super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
$$;

-- 2. Audit log
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin read audit" ON public.admin_audit_log
  FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "super_admin insert audit" ON public.admin_audit_log
  FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() AND actor_user_id = auth.uid());
CREATE INDEX idx_admin_audit_created ON public.admin_audit_log(created_at DESC);

-- 3. Histórico de planos
CREATE TABLE public.tenant_plan_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  previous_plan text,
  new_plan text NOT NULL,
  previous_status text,
  new_status text NOT NULL,
  changed_by uuid NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tenant_plan_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin read plan history" ON public.tenant_plan_history
  FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "tenant member read own plan history" ON public.tenant_plan_history
  FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY "super_admin insert plan history" ON public.tenant_plan_history
  FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() AND changed_by = auth.uid());
CREATE INDEX idx_plan_history_tenant ON public.tenant_plan_history(tenant_id, created_at DESC);

-- 4. Políticas adicionais super_admin (somente leitura/gestão global, sem afetar políticas existentes)
CREATE POLICY "super_admin read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "super_admin update profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (public.is_super_admin());

CREATE POLICY "super_admin read all tenants" ON public.tenants
  FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "super_admin update tenants" ON public.tenants
  FOR UPDATE TO authenticated USING (public.is_super_admin());

CREATE POLICY "super_admin read all user_roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "super_admin manage user_roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.is_super_admin());
CREATE POLICY "super_admin delete user_roles" ON public.user_roles
  FOR DELETE TO authenticated USING (public.is_super_admin());

CREATE POLICY "super_admin read all agendamentos" ON public.agendamentos
  FOR SELECT TO authenticated USING (public.is_super_admin());

CREATE POLICY "super_admin read payment events" ON public.payment_events
  FOR SELECT TO authenticated USING (public.is_super_admin());
