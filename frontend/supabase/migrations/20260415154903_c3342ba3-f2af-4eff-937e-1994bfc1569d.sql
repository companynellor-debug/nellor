
DROP FUNCTION IF EXISTS public.get_supplier_subscription(uuid);

CREATE FUNCTION public.get_supplier_subscription(_supplier_id uuid)
RETURNS TABLE(
  id uuid,
  status text,
  plan_name text,
  price numeric,
  started_at timestamptz,
  expires_at timestamptz,
  days_remaining integer,
  max_products integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ss.id,
    ss.status::text,
    ss.plan_name,
    ss.price,
    ss.started_at,
    ss.expires_at,
    CASE
      WHEN ss.expires_at IS NOT NULL THEN
        GREATEST(0, EXTRACT(DAY FROM ss.expires_at - now())::integer)
      ELSE NULL
    END AS days_remaining,
    ss.max_products
  FROM public.supplier_subscriptions ss
  WHERE ss.supplier_id = _supplier_id
  ORDER BY ss.created_at DESC
  LIMIT 1;
$$;
