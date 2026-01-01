-- Service Provider invite acceptance (supplier-side) with proper authorization

CREATE OR REPLACE FUNCTION public.accept_service_provider_invite(
  _service_provider_id uuid,
  _supplier_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _supplier_id THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  -- Ensure supplier allows service providers
  IF NOT EXISTS (
    SELECT 1
    FROM public.supplier_service_provider_settings s
    WHERE s.supplier_id = _supplier_id
      AND COALESCE(s.allow_service_providers, false) = true
  ) THEN
    RAISE EXCEPTION 'Fornecedor não permite prestadores de serviço';
  END IF;

  INSERT INTO public.service_provider_suppliers (service_provider_id, supplier_id)
  VALUES (_service_provider_id, _supplier_id)
  ON CONFLICT (service_provider_id, supplier_id) DO NOTHING;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_service_provider_invite(uuid, uuid) TO authenticated;
