
CREATE TABLE public.terms_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  terms_version text NOT NULL,
  privacy_version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_terms_acceptances_user_id ON public.terms_acceptances(user_id);

ALTER TABLE public.terms_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own acceptances"
  ON public.terms_acceptances FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "super_admin read all acceptances"
  ON public.terms_acceptances FOR SELECT TO authenticated
  USING (is_super_admin());
-- No INSERT/UPDATE/DELETE policy: only service role (server functions) can write.
