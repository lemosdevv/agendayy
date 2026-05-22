BEGIN;
ALTER TABLE public.tenant_subscriptions DROP CONSTRAINT IF EXISTS tenant_subscriptions_plan_check;
UPDATE public.tenant_subscriptions SET plan = CASE plan WHEN 'basico' THEN 'start' WHEN 'pro' THEN 'profissional' WHEN 'premium' THEN 'studio' ELSE plan END;
UPDATE public.tenants SET plan = CASE plan WHEN 'basico' THEN 'start' WHEN 'pro' THEN 'profissional' WHEN 'premium' THEN 'studio' ELSE plan END;
ALTER TABLE public.tenant_subscriptions ADD CONSTRAINT tenant_subscriptions_plan_check CHECK (plan = ANY (ARRAY['start'::text, 'profissional'::text, 'studio'::text]));
COMMIT;