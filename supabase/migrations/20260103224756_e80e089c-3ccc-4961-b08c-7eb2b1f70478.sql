-- =====================================================
-- NELLOR DROP - RPC FUNCTIONS E AUDIT TRIGGER
-- =====================================================

-- AUDIT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.log_drop_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.drop_audit_log (user_id, action, entity_type, entity_id, new_value)
    VALUES (COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid), 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.drop_audit_log (user_id, action, entity_type, entity_id, old_value, new_value)
    VALUES (COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid), 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.drop_audit_log (user_id, action, entity_type, entity_id, old_value)
    VALUES (COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid), 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Audit triggers
CREATE TRIGGER audit_product_drop_settings
  AFTER INSERT OR UPDATE OR DELETE ON public.product_drop_settings
  FOR EACH ROW EXECUTE FUNCTION public.log_drop_audit();

CREATE TRIGGER audit_client_drop_products
  AFTER INSERT OR UPDATE OR DELETE ON public.client_drop_products
  FOR EACH ROW EXECUTE FUNCTION public.log_drop_audit();

CREATE TRIGGER audit_drop_orders
  AFTER INSERT OR UPDATE OR DELETE ON public.drop_orders
  FOR EACH ROW EXECUTE FUNCTION public.log_drop_audit();

-- =====================================================
-- RPC FUNCTIONS
-- =====================================================

-- Admin stats
CREATE OR REPLACE FUNCTION public.get_drop_admin_stats()
RETURNS TABLE (
  total_gmv numeric,
  total_client_margin numeric,
  total_platform_fees numeric,
  pending_commissions numeric,
  active_drop_clients bigint,
  active_drop_suppliers bigint,
  total_drop_orders bigint,
  paid_drop_orders bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN dro.payment_status = 'paid' THEN dro.total ELSE 0 END), 0::numeric) as total_gmv,
    COALESCE(SUM(CASE WHEN dro.payment_status = 'paid' THEN dro.client_margin ELSE 0 END), 0::numeric) as total_client_margin,
    COALESCE(SUM(CASE WHEN dro.payment_status = 'paid' THEN dro.platform_fee ELSE 0 END), 0::numeric) as total_platform_fees,
    COALESCE(SUM(CASE WHEN dro.payment_status = 'paid' AND dro.order_status != 'cancelled' THEN dro.supplier_amount ELSE 0 END), 0::numeric) as pending_commissions,
    (SELECT COUNT(DISTINCT user_id) FROM client_drop_profiles WHERE drop_enabled = true)::bigint as active_drop_clients,
    (SELECT COUNT(DISTINCT supplier_id) FROM supplier_drop_settings WHERE drop_enabled = true)::bigint as active_drop_suppliers,
    COUNT(*)::bigint as total_drop_orders,
    COUNT(*) FILTER (WHERE dro.payment_status = 'paid')::bigint as paid_drop_orders
  FROM drop_orders dro;
END;
$$;

-- Admin suppliers list
CREATE OR REPLACE FUNCTION public.get_drop_suppliers_admin()
RETURNS TABLE (
  supplier_id uuid,
  supplier_name text,
  drop_enabled boolean,
  products_in_drop bigint,
  total_sales numeric,
  total_orders bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sds.supplier_id,
    p.nome as supplier_name,
    sds.drop_enabled,
    COALESCE((SELECT COUNT(*) FROM product_drop_settings pds WHERE pds.supplier_id = sds.supplier_id AND pds.drop_enabled = true), 0)::bigint as products_in_drop,
    COALESCE((SELECT SUM(total) FROM drop_orders dro WHERE dro.supplier_id = sds.supplier_id AND dro.payment_status = 'paid'), 0::numeric) as total_sales,
    COALESCE((SELECT COUNT(*) FROM drop_orders dro WHERE dro.supplier_id = sds.supplier_id), 0)::bigint as total_orders
  FROM supplier_drop_settings sds
  LEFT JOIN profiles p ON p.id = sds.supplier_id
  ORDER BY total_sales DESC;
END;
$$;

-- Admin clients list
CREATE OR REPLACE FUNCTION public.get_drop_clients_admin()
RETURNS TABLE (
  client_id uuid,
  client_name text,
  business_name text,
  drop_enabled boolean,
  products_count bigint,
  total_revenue numeric,
  total_margin numeric,
  total_orders bigint,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cdp.user_id as client_id,
    p.nome as client_name,
    cdp.business_name,
    cdp.drop_enabled,
    COALESCE((SELECT COUNT(*) FROM client_drop_products WHERE client_drop_products.client_id = cdp.user_id AND is_active = true), 0)::bigint as products_count,
    COALESCE((SELECT SUM(total) FROM drop_orders WHERE drop_orders.client_id = cdp.user_id AND payment_status = 'paid'), 0::numeric) as total_revenue,
    COALESCE((SELECT SUM(client_margin) FROM drop_orders WHERE drop_orders.client_id = cdp.user_id AND payment_status = 'paid'), 0::numeric) as total_margin,
    COALESCE((SELECT COUNT(*) FROM drop_orders WHERE drop_orders.client_id = cdp.user_id), 0)::bigint as total_orders,
    cdp.created_at
  FROM client_drop_profiles cdp
  LEFT JOIN profiles p ON p.id = cdp.user_id
  ORDER BY total_revenue DESC;
END;
$$;

-- Drop catalog for clients
CREATE OR REPLACE FUNCTION public.get_drop_catalog()
RETURNS TABLE (
  product_id uuid,
  product_name text,
  product_images text[],
  product_description text,
  base_price numeric,
  commission_percent numeric,
  shipping_days integer,
  supplier_id uuid,
  supplier_name text,
  supplier_avatar text,
  stock integer,
  allow_affiliates boolean,
  allow_service_providers boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as product_id,
    p.nome as product_name,
    p.imagens as product_images,
    p.descricao_curta as product_description,
    p.preco as base_price,
    pds.commission_percent,
    pds.shipping_days_estimate as shipping_days,
    p.supplier_id,
    prof.nome as supplier_name,
    prof.foto_perfil_url as supplier_avatar,
    p.estoque as stock,
    pds.allow_affiliates,
    pds.allow_service_providers
  FROM products p
  INNER JOIN product_drop_settings pds ON pds.product_id = p.id
  INNER JOIN supplier_drop_settings sds ON sds.supplier_id = p.supplier_id
  INNER JOIN profiles prof ON prof.id = p.supplier_id
  WHERE p.ativo = true
    AND p.estoque > 0
    AND pds.drop_enabled = true
    AND sds.drop_enabled = true
    AND COALESCE(prof.ativo, true) = true
  ORDER BY p.created_at DESC;
END;
$$;

-- Client drop stats
CREATE OR REPLACE FUNCTION public.get_client_drop_stats(_client_id uuid)
RETURNS TABLE (
  total_sales numeric,
  total_profit numeric,
  active_products bigint,
  pending_orders bigint,
  avg_commission numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE((SELECT SUM(total) FROM drop_orders WHERE client_id = _client_id AND payment_status = 'paid'), 0::numeric) as total_sales,
    COALESCE((SELECT SUM(client_margin) FROM drop_orders WHERE client_id = _client_id AND payment_status = 'paid'), 0::numeric) as total_profit,
    COALESCE((SELECT COUNT(*) FROM client_drop_products WHERE client_id = _client_id AND is_active = true), 0)::bigint as active_products,
    COALESCE((SELECT COUNT(*) FROM drop_orders WHERE client_id = _client_id AND order_status NOT IN ('delivered', 'cancelled')), 0)::bigint as pending_orders,
    COALESCE((SELECT AVG(client_margin / NULLIF(total, 0) * 100) FROM drop_orders WHERE client_id = _client_id AND payment_status = 'paid'), 0::numeric) as avg_commission;
END;
$$;

-- Supplier drop stats
CREATE OR REPLACE FUNCTION public.get_supplier_drop_stats(_supplier_id uuid)
RETURNS TABLE (
  total_sales numeric,
  total_orders bigint,
  products_in_drop bigint,
  pending_orders bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE((SELECT SUM(supplier_amount) FROM drop_orders WHERE supplier_id = _supplier_id AND payment_status = 'paid'), 0::numeric) as total_sales,
    COALESCE((SELECT COUNT(*) FROM drop_orders WHERE supplier_id = _supplier_id), 0)::bigint as total_orders,
    COALESCE((SELECT COUNT(*) FROM product_drop_settings WHERE supplier_id = _supplier_id AND drop_enabled = true), 0)::bigint as products_in_drop,
    COALESCE((SELECT COUNT(*) FROM drop_orders WHERE supplier_id = _supplier_id AND order_status NOT IN ('delivered', 'cancelled')), 0)::bigint as pending_orders;
END;
$$;