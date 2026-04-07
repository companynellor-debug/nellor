CREATE OR REPLACE FUNCTION public.get_admin_subscriptions()
RETURNS TABLE(
  id uuid,
  supplier_id uuid,
  supplier_name text,
  supplier_email text,
  status text,
  plan_name text,
  price numeric,
  started_at timestamptz,
  expires_at timestamptz,
  payment_method text,
  notes text,
  created_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT s.id, s.supplier_id, p.nome AS supplier_name, p.email AS supplier_email,
    s.status::text, s.plan_name, s.price,
    s.started_at, s.expires_at, s.payment_method, s.notes, s.created_at
  FROM supplier_subscriptions s
  LEFT JOIN profiles p ON p.id = s.supplier_id
  ORDER BY s.created_at DESC;
$$;