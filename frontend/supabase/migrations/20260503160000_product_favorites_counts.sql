-- Allow suppliers to count favorites per product without exposing user data
CREATE OR REPLACE FUNCTION public.get_product_favorites_counts(product_ids uuid[])
RETURNS TABLE(product_id uuid, count bigint)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT ci.reference_id AS product_id, COUNT(*)::bigint AS count
  FROM public.collection_items ci
  WHERE ci.type = 'product'
    AND ci.reference_id = ANY(product_ids)
  GROUP BY ci.reference_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_product_favorites_counts(uuid[]) TO authenticated, anon;
