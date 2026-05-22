
CREATE OR REPLACE FUNCTION public.complete_onboarding(
  _name text,
  _slug text,
  _business_type business_type,
  _phone text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _tenant_id uuid;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.tenants (name, slug, business_type)
  VALUES (_name, _slug, _business_type)
  RETURNING id INTO _tenant_id;

  INSERT INTO public.user_roles (user_id, tenant_id, role)
  VALUES (_uid, _tenant_id, 'owner');

  UPDATE public.profiles
  SET tenant_id = _tenant_id,
      phone = COALESCE(_phone, phone),
      onboarded = true
  WHERE id = _uid;

  RETURN _tenant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_onboarding(text, text, business_type, text) TO authenticated;
