-- Dedupe key for plan webhook events
CREATE UNIQUE INDEX IF NOT EXISTS plan_payment_events_provider_event_uidx
  ON public.plan_payment_events (provider, event_type, external_id);

-- Dedupe key for appointment payment events
CREATE UNIQUE INDEX IF NOT EXISTS payment_events_provider_external_uidx
  ON public.payment_events (provider, external_id);