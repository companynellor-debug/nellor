-- Add missing columns to product_drop_settings
ALTER TABLE public.product_drop_settings
ADD COLUMN IF NOT EXISTS min_resale_price NUMERIC,
ADD COLUMN IF NOT EXISTS max_commission_percent NUMERIC;

-- Update the get_drop_catalog function to include new columns
CREATE OR REPLACE FUNCTION public.get_drop_catalog()
 RETURNS TABLE(product_id uuid, product_name text, product_images text[], product_description text, base_price numeric, min_resale_price numeric, max_commission_percent numeric, commission_percent numeric, shipping_days integer, supplier_id uuid, supplier_name text, supplier_avatar text, stock integer, allow_affiliates boolean, allow_service_providers boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;