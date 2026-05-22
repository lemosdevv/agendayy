
-- Restrict execute on SECURITY DEFINER funcs
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_tenant_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated;

-- Tighten tenant insert: must be authenticated (auth.uid() not null)
DROP POLICY IF EXISTS "Authenticated create tenant" ON public.tenants;
CREATE POLICY "Authenticated create tenant" ON public.tenants
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
