-- =====================================================
-- NELLOR DROP - DATABASE SCHEMA (COMPLETO)
-- =====================================================

-- 1. Configurações de Drop do Fornecedor
CREATE TABLE public.supplier_drop_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL UNIQUE,
  drop_enabled boolean DEFAULT false,
  default_commission_percent numeric DEFAULT 10,
  allow_affiliates_on_drop boolean DEFAULT true,
  allow_service_providers_on_drop boolean DEFAULT true,
  min_order_value numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Produtos disponíveis no Drop
CREATE TABLE public.product_drop_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL,
  drop_enabled boolean DEFAULT false,
  commission_percent numeric DEFAULT 10,
  allow_affiliates boolean DEFAULT true,
  allow_service_providers boolean DEFAULT true,
  shipping_days_estimate integer DEFAULT 7,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Cliente no modo Drop
CREATE TABLE public.client_drop_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  drop_enabled boolean DEFAULT true,
  business_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Produtos do cliente Drop
CREATE TABLE public.client_drop_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_drop_setting_id uuid NOT NULL REFERENCES public.product_drop_settings(id) ON DELETE CASCADE,
  custom_price numeric NOT NULL,
  margin_type text DEFAULT 'fixed' CHECK (margin_type IN ('fixed', 'percentage')),
  margin_value numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, product_id)
);

-- 5. Pedidos Drop
CREATE TABLE public.drop_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE DEFAULT public.generate_order_number(),
  client_id uuid NOT NULL,
  supplier_id uuid NOT NULL,
  client_drop_product_id uuid NOT NULL REFERENCES public.client_drop_products(id),
  product_id uuid NOT NULL REFERENCES public.products(id),
  buyer_name text NOT NULL,
  buyer_email text,
  buyer_phone text,
  buyer_document text,
  shipping_address jsonb NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  base_price numeric NOT NULL,
  sale_price numeric NOT NULL,
  client_margin numeric NOT NULL,
  platform_fee numeric DEFAULT 0,
  supplier_amount numeric NOT NULL,
  total numeric NOT NULL,
  external_marketplace text,
  external_order_id text,
  order_status text DEFAULT 'pending' CHECK (order_status IN ('pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'cancelled')),
  tracking_code text,
  shipping_company text,
  estimated_delivery date,
  paid_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Log de auditoria
CREATE TABLE public.drop_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- INDEXES
CREATE INDEX idx_product_drop_settings_supplier ON public.product_drop_settings(supplier_id);
CREATE INDEX idx_product_drop_settings_enabled ON public.product_drop_settings(drop_enabled) WHERE drop_enabled = true;
CREATE INDEX idx_client_drop_products_client ON public.client_drop_products(client_id);
CREATE INDEX idx_client_drop_products_active ON public.client_drop_products(is_active) WHERE is_active = true;
CREATE INDEX idx_drop_orders_client ON public.drop_orders(client_id);
CREATE INDEX idx_drop_orders_supplier ON public.drop_orders(supplier_id);
CREATE INDEX idx_drop_orders_status ON public.drop_orders(order_status);
CREATE INDEX idx_drop_audit_log_user ON public.drop_audit_log(user_id);
CREATE INDEX idx_drop_audit_log_entity ON public.drop_audit_log(entity_type, entity_id);

-- ENABLE RLS
ALTER TABLE public.supplier_drop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_drop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_drop_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_drop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drop_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES - supplier_drop_settings
CREATE POLICY "Suppliers can manage their drop settings"
ON public.supplier_drop_settings FOR ALL
USING (supplier_id = auth.uid() AND has_role(auth.uid(), 'fornecedor'))
WITH CHECK (supplier_id = auth.uid() AND has_role(auth.uid(), 'fornecedor'));

CREATE POLICY "Admins can manage all drop settings"
ON public.supplier_drop_settings FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can view enabled supplier drop settings"
ON public.supplier_drop_settings FOR SELECT
USING (drop_enabled = true);

-- RLS POLICIES - product_drop_settings
CREATE POLICY "Suppliers can manage their product drop settings"
ON public.product_drop_settings FOR ALL
USING (supplier_id = auth.uid() AND has_role(auth.uid(), 'fornecedor'))
WITH CHECK (supplier_id = auth.uid() AND has_role(auth.uid(), 'fornecedor'));

CREATE POLICY "Admins can manage all product drop settings"
ON public.product_drop_settings FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can view enabled product drop settings"
ON public.product_drop_settings FOR SELECT
USING (drop_enabled = true);

-- RLS POLICIES - client_drop_profiles
CREATE POLICY "Clients can manage their drop profile"
ON public.client_drop_profiles FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all client drop profiles"
ON public.client_drop_profiles FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Suppliers can view client drop profiles"
ON public.client_drop_profiles FOR SELECT
USING (has_role(auth.uid(), 'fornecedor'));

-- RLS POLICIES - client_drop_products
CREATE POLICY "Clients can manage their drop products"
ON public.client_drop_products FOR ALL
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid());

CREATE POLICY "Admins can manage all client drop products"
ON public.client_drop_products FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Suppliers can view drop products of their products"
ON public.client_drop_products FOR SELECT
USING (
  product_id IN (
    SELECT id FROM public.products WHERE supplier_id = auth.uid()
  )
);

-- RLS POLICIES - drop_orders
CREATE POLICY "Clients can manage their drop orders"
ON public.drop_orders FOR ALL
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid());

CREATE POLICY "Suppliers can view and update drop orders for their products"
ON public.drop_orders FOR ALL
USING (supplier_id = auth.uid() AND has_role(auth.uid(), 'fornecedor'));

CREATE POLICY "Admins can manage all drop orders"
ON public.drop_orders FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS POLICIES - drop_audit_log
CREATE POLICY "Users can view their own audit logs"
ON public.drop_audit_log FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs"
ON public.drop_audit_log FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs"
ON public.drop_audit_log FOR INSERT
WITH CHECK (true);

-- TRIGGERS - Updated at
CREATE TRIGGER update_supplier_drop_settings_updated_at
  BEFORE UPDATE ON public.supplier_drop_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_drop_settings_updated_at
  BEFORE UPDATE ON public.product_drop_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_drop_profiles_updated_at
  BEFORE UPDATE ON public.client_drop_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_drop_products_updated_at
  BEFORE UPDATE ON public.client_drop_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_drop_orders_updated_at
  BEFORE UPDATE ON public.drop_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();