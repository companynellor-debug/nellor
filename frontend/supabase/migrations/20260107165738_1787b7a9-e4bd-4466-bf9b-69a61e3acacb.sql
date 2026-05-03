-- Drop the existing function first
DROP FUNCTION IF EXISTS public.get_drop_catalog();

-- Create updated function with new fields
CREATE OR REPLACE FUNCTION public.get_drop_catalog()
RETURNS TABLE(
  product_id UUID,
  product_name TEXT,
  product_images TEXT[],
  product_description TEXT,
  base_price NUMERIC,
  min_resale_price NUMERIC,
  max_commission_percent NUMERIC,
  commission_percent NUMERIC,
  shipping_days INTEGER,
  supplier_id UUID,
  supplier_name TEXT,
  supplier_avatar TEXT,
  stock INTEGER,
  allow_affiliates BOOLEAN,
  allow_service_providers BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS product_id,
    p.nome AS product_name,
    p.imagens AS product_images,
    p.descricao_curta AS product_description,
    p.preco AS base_price,
    pds.min_resale_price,
    pds.max_commission_percent,
    pds.commission_percent,
    COALESCE(pds.shipping_days_estimate, 7) AS shipping_days,
    p.supplier_id,
    pr.nome AS supplier_name,
    pr.foto_perfil_url AS supplier_avatar,
    p.estoque AS stock,
    COALESCE(pds.allow_affiliates, false) AS allow_affiliates,
    COALESCE(pds.allow_service_providers, false) AS allow_service_providers
  FROM products p
  INNER JOIN product_drop_settings pds ON pds.product_id = p.id
  INNER JOIN profiles pr ON pr.id = p.supplier_id
  WHERE pds.drop_enabled = true
    AND p.ativo = true
    AND p.estoque > 0
    AND pr.ativo = true;
END;
$$;