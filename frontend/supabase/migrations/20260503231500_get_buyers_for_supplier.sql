-- Allow suppliers to see basic profile info of buyers who negotiated with them
CREATE OR REPLACE FUNCTION public.get_buyers_for_supplier(buyer_ids uuid[])
RETURNS TABLE(id uuid, nome text, foto_perfil_url text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT p.id, p.nome, p.foto_perfil_url
  FROM public.profiles p
  WHERE p.id = ANY(buyer_ids)
    AND EXISTS (
      SELECT 1 FROM public.negotiations n
      WHERE n.supplier_id = auth.uid()
        AND n.buyer_id = p.id
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_buyers_for_supplier(uuid[]) TO authenticated;
