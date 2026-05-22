CREATE TABLE public.security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  user_id uuid,
  tenant_id uuid,
  ip_address text,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin read security logs"
  ON public.security_logs FOR SELECT TO authenticated
  USING (is_super_admin());

CREATE INDEX idx_security_logs_user ON public.security_logs (user_id, created_at DESC);
CREATE INDEX idx_security_logs_tenant ON public.security_logs (tenant_id, created_at DESC);
CREATE INDEX idx_security_logs_event ON public.security_logs (event_type, created_at DESC);
CREATE INDEX idx_security_logs_severity ON public.security_logs (severity, created_at DESC) WHERE severity IN ('warn','error','critical');