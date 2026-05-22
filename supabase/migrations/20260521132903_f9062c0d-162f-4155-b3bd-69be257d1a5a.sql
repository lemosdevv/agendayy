
CREATE TABLE public.tenant_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  plan text NOT NULL CHECK (plan IN ('basico','pro','premium')),
  provider text NOT NULL DEFAULT 'mercadopago',
  mode text NOT NULL CHECK (mode IN ('recurring','one_time')),
  mp_preapproval_id text,
  mp_preference_id text,
  mp_payer_email text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','authorized','paid','cancelled','failed')),
  amount numeric NOT NULL DEFAULT 0,
  current_period_end timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tenant_subs_tenant ON public.tenant_subscriptions(tenant_id, created_at DESC);
CREATE INDEX idx_tenant_subs_preapproval ON public.tenant_subscriptions(mp_preapproval_id) WHERE mp_preapproval_id IS NOT NULL;
CREATE INDEX idx_tenant_subs_preference ON public.tenant_subscriptions(mp_preference_id) WHERE mp_preference_id IS NOT NULL;

ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant member read own subs"
  ON public.tenant_subscriptions FOR SELECT TO authenticated
  USING (is_tenant_member(tenant_id));

CREATE POLICY "super_admin read all subs"
  ON public.tenant_subscriptions FOR SELECT TO authenticated
  USING (is_super_admin());

CREATE TRIGGER trg_tenant_subscriptions_updated_at
  BEFORE UPDATE ON public.tenant_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.plan_payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'mercadopago',
  external_id text NOT NULL,
  event_type text NOT NULL,
  tenant_id uuid,
  subscription_id uuid REFERENCES public.tenant_subscriptions(id) ON DELETE SET NULL,
  status text NOT NULL,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_plan_payment_events_tenant ON public.plan_payment_events(tenant_id, created_at DESC);

ALTER TABLE public.plan_payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "no_client_access_plan_payment_events"
  ON public.plan_payment_events FOR SELECT TO authenticated
  USING (false);

CREATE POLICY "super_admin read plan payment events"
  ON public.plan_payment_events FOR SELECT TO authenticated
  USING (is_super_admin());
