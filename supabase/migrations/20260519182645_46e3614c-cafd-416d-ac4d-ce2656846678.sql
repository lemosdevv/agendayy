
-- Trial & plan columns on tenants
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS trial_start_date timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS plan_status text NOT NULL DEFAULT 'active';

-- Backfill trial_start_date from created_at for existing tenants
UPDATE public.tenants
SET trial_start_date = created_at
WHERE trial_start_date > created_at;

-- Unique slug
CREATE UNIQUE INDEX IF NOT EXISTS tenants_slug_unique_idx ON public.tenants (lower(slug));

-- Function to update slug safely (owner only, validated, unique)
CREATE OR REPLACE FUNCTION public.update_tenant_slug(_new_slug text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _tenant_id uuid;
  _normalized text;
  _exists boolean;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Normalize: lowercase, trim, strip accents, spaces -> dash, only [a-z0-9-]
  _normalized := lower(trim(_new_slug));
  _normalized := translate(_normalized,
    'áàâãäåāăąçćčďđéèêëēĕėęěíìîïīĭįıłńñňóòôõöōŏőřśšşťţúùûüūŭůűųýÿžźż',
    'aaaaaaaaacccddeeeeeeeeiiiiiiiilnnnoooooooorsssttuuuuuuuuuyyzzz');
  _normalized := regexp_replace(_normalized, '\s+', '-', 'g');
  _normalized := regexp_replace(_normalized, '[^a-z0-9-]', '', 'g');
  _normalized := regexp_replace(_normalized, '-+', '-', 'g');
  _normalized := trim(both '-' from _normalized);

  IF length(_normalized) < 3 OR length(_normalized) > 40 THEN
    RAISE EXCEPTION 'O link precisa ter entre 3 e 40 caracteres (apenas letras, números e hífen)';
  END IF;

  -- Find caller's tenant via owner role
  SELECT tenant_id INTO _tenant_id
  FROM public.user_roles
  WHERE user_id = _uid AND role = 'owner'
  LIMIT 1;

  IF _tenant_id IS NULL THEN
    RAISE EXCEPTION 'Apenas o dono do estabelecimento pode alterar o link';
  END IF;

  -- Uniqueness check (ignore own row)
  SELECT EXISTS (
    SELECT 1 FROM public.tenants
    WHERE lower(slug) = _normalized AND id <> _tenant_id
  ) INTO _exists;

  IF _exists THEN
    RAISE EXCEPTION 'Esse link já está em uso. Tente outro.';
  END IF;

  UPDATE public.tenants SET slug = _normalized, updated_at = now() WHERE id = _tenant_id;

  RETURN _normalized;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_tenant_slug(text) TO authenticated;
