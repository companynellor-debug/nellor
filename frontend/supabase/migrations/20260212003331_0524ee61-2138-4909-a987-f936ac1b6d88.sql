
-- ===================================
-- FASE 3: Categorias do Fornecedor
-- ===================================
CREATE TABLE public.supplier_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id uuid NOT NULL,
  nome text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read supplier categories"
  ON public.supplier_categories FOR SELECT USING (true);

CREATE POLICY "Suppliers can manage their categories"
  ON public.supplier_categories FOR ALL
  USING (supplier_id = auth.uid() AND has_role(auth.uid(), 'fornecedor'::app_role))
  WITH CHECK (supplier_id = auth.uid() AND has_role(auth.uid(), 'fornecedor'::app_role));

CREATE POLICY "Admins can manage all supplier categories"
  ON public.supplier_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ===================================
-- FASE 4: Campos avançados de produto
-- ===================================
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS tamanhos jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cores jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_kit boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS kit_items jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS origin text DEFAULT 'nacional';

-- ===================================
-- FASE 5: Sistema de Denúncia
-- ===================================
CREATE TABLE public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('product', 'supplier')),
  target_id uuid NOT NULL,
  reason text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view their own reports"
  ON public.reports FOR SELECT
  USING (reporter_id = auth.uid());

CREATE POLICY "Admins can manage all reports"
  ON public.reports FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ===================================
-- FASE 6: Estrutura de Reembolso
-- ===================================
CREATE TABLE public.refund_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id),
  buyer_id uuid NOT NULL,
  supplier_id uuid NOT NULL,
  reason text NOT NULL DEFAULT 'not_received',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  resolved_at timestamptz
);

ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can create refund requests"
  ON public.refund_requests FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Buyers can view their refund requests"
  ON public.refund_requests FOR SELECT
  USING (buyer_id = auth.uid());

CREATE POLICY "Buyers can update their refund requests"
  ON public.refund_requests FOR UPDATE
  USING (buyer_id = auth.uid());

CREATE POLICY "Suppliers can view refund requests"
  ON public.refund_requests FOR SELECT
  USING (supplier_id = auth.uid());

CREATE POLICY "Admins can manage all refund requests"
  ON public.refund_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ===================================
-- FASE 7: Sistema de Patrocínio
-- ===================================
CREATE TABLE public.sponsored_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id),
  supplier_id uuid NOT NULL,
  banner_url text,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  approved_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sponsored_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers can create sponsorship requests"
  ON public.sponsored_products FOR INSERT
  WITH CHECK (supplier_id = auth.uid() AND has_role(auth.uid(), 'fornecedor'::app_role));

CREATE POLICY "Suppliers can view their sponsorships"
  ON public.sponsored_products FOR SELECT
  USING (supplier_id = auth.uid());

CREATE POLICY "Everyone can view approved sponsorships"
  ON public.sponsored_products FOR SELECT
  USING (status = 'approved' AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Admins can manage all sponsorships"
  ON public.sponsored_products FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ===================================
-- FASE 8: Sistema de Trends
-- ===================================
CREATE TABLE public.trend_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id),
  supplier_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz
);

ALTER TABLE public.trend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers can create trend requests"
  ON public.trend_requests FOR INSERT
  WITH CHECK (supplier_id = auth.uid() AND has_role(auth.uid(), 'fornecedor'::app_role));

CREATE POLICY "Suppliers can view their trend requests"
  ON public.trend_requests FOR SELECT
  USING (supplier_id = auth.uid());

CREATE POLICY "Everyone can view approved trends"
  ON public.trend_requests FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Admins can manage all trend requests"
  ON public.trend_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));
