ALTER TABLE public.tenant_subscriptions
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS tenant_subscriptions_idempotency_uidx
  ON public.tenant_subscriptions (tenant_id, plan, idempotency_key)
  WHERE idempotency_key IS NOT NULL;