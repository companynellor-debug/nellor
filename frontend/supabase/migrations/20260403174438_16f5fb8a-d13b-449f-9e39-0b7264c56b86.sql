
-- Drop old function first (return type changed)
DROP FUNCTION IF EXISTS public.get_admin_sponsorship_requests();

-- Recreate without has_role filter inside body
CREATE OR REPLACE FUNCTION public.get_admin_sponsorship_requests()
RETURNS TABLE(
  id uuid,
  supplier_id uuid,
  type text,
  product_id uuid,
  banner_image_url text,
  message text,
  status text,
  admin_response text,
  scheduled_date date,
  created_at timestamptz,
  supplier_name text,
  product_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sr.id,
    sr.supplier_id,
    sr.type::text,
    sr.product_id,
    sr.banner_image_url,
    sr.message,
    sr.status::text,
    sr.admin_response,
    sr.scheduled_date,
    sr.created_at,
    p.nome AS supplier_name,
    pr.nome AS product_name
  FROM public.sponsorship_requests sr
  LEFT JOIN public.profiles p ON p.id = sr.supplier_id
  LEFT JOIN public.products pr ON pr.id = sr.product_id
  ORDER BY sr.created_at DESC;
$$;
