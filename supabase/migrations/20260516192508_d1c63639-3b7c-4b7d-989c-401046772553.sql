-- Google Calendar OAuth tokens (per user)
CREATE TABLE public.google_calendar_tokens (
  user_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expiry TIMESTAMPTZ NOT NULL,
  calendar_id TEXT DEFAULT 'primary',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own google tokens" ON public.google_calendar_tokens
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER set_gct_updated BEFORE UPDATE ON public.google_calendar_tokens
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Link agendamento -> external google event
ALTER TABLE public.agendamentos
  ADD COLUMN IF NOT EXISTS google_event_id TEXT,
  ADD COLUMN IF NOT EXISTS pagamento_status TEXT NOT NULL DEFAULT 'nao_solicitado',
  ADD COLUMN IF NOT EXISTS pagamento_id TEXT,
  ADD COLUMN IF NOT EXISTS pagamento_link TEXT,
  ADD COLUMN IF NOT EXISTS lembrete_enviado_em TIMESTAMPTZ;

-- Payment events log (for webhook idempotency)
CREATE TABLE public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  external_id TEXT NOT NULL,
  agendamento_id UUID,
  status TEXT NOT NULL,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, external_id)
);
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
-- no client policies — only server (service role) writes