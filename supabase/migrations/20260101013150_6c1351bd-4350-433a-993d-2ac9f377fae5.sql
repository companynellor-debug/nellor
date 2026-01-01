-- =====================================================
-- NELLOR MARKETPLACE - SISTEMA DE AFILIADOS E PRESTADORES
-- =====================================================

-- 1. ENUM TYPES
CREATE TYPE public.affiliate_status AS ENUM ('pending', 'active', 'suspended');
CREATE TYPE public.service_provider_status AS ENUM ('pending', 'active', 'suspended');
CREATE TYPE public.commission_status AS ENUM ('pending', 'confirmed', 'paid', 'cancelled');
CREATE TYPE public.crm_contract_type AS ENUM ('single', 'monthly');

-- 2. TABELA DE AFILIADOS
-- Armazena clientes que ativaram função de afiliado
CREATE TABLE public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status affiliate_status NOT NULL DEFAULT 'active',
  stripe_account_id TEXT, -- Conta Stripe Connect do afiliado para receber comissões
  stripe_ready BOOLEAN DEFAULT false,
  pix_key TEXT,
  total_earnings NUMERIC DEFAULT 0,
  pending_earnings NUMERIC DEFAULT 0,
  terms_accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- 3. CONFIGURAÇÕES DE AFILIADOS DO FORNECEDOR
-- Define se o fornecedor permite afiliados e configurações
CREATE TABLE public.supplier_affiliate_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  allow_affiliates BOOLEAN DEFAULT false,
  default_commission_percent NUMERIC DEFAULT 5 CHECK (default_commission_percent >= 0 AND default_commission_percent <= 50),
  allow_recurring_commission BOOLEAN DEFAULT false, -- Comissão recorrente por cliente indicado
  recurring_duration_months INTEGER DEFAULT 4, -- Janela de comissão em meses
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(supplier_id)
);

-- 4. COMISSÃO POR PRODUTO (override do padrão)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS affiliate_commission_percent NUMERIC DEFAULT NULL 
  CHECK (affiliate_commission_percent IS NULL OR (affiliate_commission_percent >= 0 AND affiliate_commission_percent <= 50));

-- 5. LINKS DE AFILIADO
-- Cada link identifica afiliado + produto + fornecedor
CREATE TABLE public.affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE, -- NULL = link geral da loja
  supplier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE, -- Código único do link (ex: ABC123)
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. RASTREAMENTO DE CLIQUES E ATRIBUIÇÃO
-- Quando alguém clica no link, registra para atribuição de comissão
CREATE TABLE public.affiliate_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_link_id UUID NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  visitor_id TEXT, -- Cookie/fingerprint para identificar visitante
  buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Quando o visitante se torna comprador
  supplier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Data limite para comissão
  converted BOOLEAN DEFAULT false
);

-- 7. COMISSÕES DE AFILIADOS
CREATE TABLE public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  attribution_id UUID REFERENCES public.affiliate_attributions(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  status commission_status DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  stripe_transfer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. PRESTADORES DE SERVIÇO
CREATE TABLE public.service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  description TEXT,
  status service_provider_status DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- 9. CONFIGURAÇÕES DE PRESTADORES DO FORNECEDOR
CREATE TABLE public.supplier_service_provider_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  allow_service_providers BOOLEAN DEFAULT false,
  can_edit_price BOOLEAN DEFAULT false,
  can_edit_stock BOOLEAN DEFAULT false,
  can_edit_photos BOOLEAN DEFAULT false,
  can_edit_description BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(supplier_id)
);

-- 10. FORNECEDORES GERENCIADOS POR PRESTADORES
-- Quando um prestador cadastra um fornecedor
CREATE TABLE public.service_provider_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(service_provider_id, supplier_id)
);

-- 11. CRM DO PRESTADOR
CREATE TABLE public.service_provider_crm (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  contract_type crm_contract_type DEFAULT 'single',
  monthly_value NUMERIC,
  next_billing_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Affiliates
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own affiliate profile"
ON public.affiliates FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own affiliate profile"
ON public.affiliates FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own affiliate profile"
ON public.affiliates FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all affiliates"
ON public.affiliates FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Supplier Affiliate Settings
ALTER TABLE public.supplier_affiliate_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers can manage their affiliate settings"
ON public.supplier_affiliate_settings FOR ALL
USING (supplier_id = auth.uid() AND public.has_role(auth.uid(), 'fornecedor'));

CREATE POLICY "Affiliates can view supplier settings"
ON public.supplier_affiliate_settings FOR SELECT
USING (allow_affiliates = true);

CREATE POLICY "Admins can manage all supplier affiliate settings"
ON public.supplier_affiliate_settings FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Affiliate Links
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can manage their links"
ON public.affiliate_links FOR ALL
USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view affiliate links for tracking"
ON public.affiliate_links FOR SELECT
USING (true);

CREATE POLICY "Admins can manage all affiliate links"
ON public.affiliate_links FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Affiliate Attributions
ALTER TABLE public.affiliate_attributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can create attributions"
ON public.affiliate_attributions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Affiliates can view their attributions"
ON public.affiliate_attributions FOR SELECT
USING (
  affiliate_link_id IN (
    SELECT id FROM public.affiliate_links 
    WHERE affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Admins can manage all attributions"
ON public.affiliate_attributions FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Affiliate Commissions
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view their commissions"
ON public.affiliate_commissions FOR SELECT
USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

CREATE POLICY "Suppliers can view commissions on their orders"
ON public.affiliate_commissions FOR SELECT
USING (
  order_id IN (SELECT id FROM public.orders WHERE supplier_id = auth.uid())
);

CREATE POLICY "Admins can manage all commissions"
ON public.affiliate_commissions FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Service Providers
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their service provider profile"
ON public.service_providers FOR ALL
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all service providers"
ON public.service_providers FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Supplier Service Provider Settings
ALTER TABLE public.supplier_service_provider_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers can manage their service provider settings"
ON public.supplier_service_provider_settings FOR ALL
USING (supplier_id = auth.uid() AND public.has_role(auth.uid(), 'fornecedor'));

CREATE POLICY "Service providers can view settings of suppliers they manage"
ON public.supplier_service_provider_settings FOR SELECT
USING (
  supplier_id IN (
    SELECT supplier_id FROM public.service_provider_suppliers 
    WHERE service_provider_id IN (SELECT id FROM public.service_providers WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Admins can manage all supplier service provider settings"
ON public.supplier_service_provider_settings FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Service Provider Suppliers
ALTER TABLE public.service_provider_suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service providers can manage their suppliers"
ON public.service_provider_suppliers FOR ALL
USING (
  service_provider_id IN (SELECT id FROM public.service_providers WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can manage all service provider suppliers"
ON public.service_provider_suppliers FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Service Provider CRM
ALTER TABLE public.service_provider_crm ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service providers can manage their CRM"
ON public.service_provider_crm FOR ALL
USING (
  service_provider_id IN (SELECT id FROM public.service_providers WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can manage all CRM entries"
ON public.service_provider_crm FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- TRIGGERS E FUNÇÕES
-- =====================================================

-- Função para gerar código único de link de afiliado
CREATE OR REPLACE FUNCTION public.generate_affiliate_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_timestamp_affiliates
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp_service_providers
  BEFORE UPDATE ON public.service_providers
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp_supplier_affiliate_settings
  BEFORE UPDATE ON public.supplier_affiliate_settings
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp_supplier_service_provider_settings
  BEFORE UPDATE ON public.supplier_service_provider_settings
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp_service_provider_crm
  BEFORE UPDATE ON public.service_provider_crm
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- Índices para performance
CREATE INDEX idx_affiliate_links_code ON public.affiliate_links(code);
CREATE INDEX idx_affiliate_attributions_buyer ON public.affiliate_attributions(buyer_id);
CREATE INDEX idx_affiliate_attributions_expires ON public.affiliate_attributions(expires_at);
CREATE INDEX idx_affiliate_commissions_affiliate ON public.affiliate_commissions(affiliate_id);
CREATE INDEX idx_affiliate_commissions_order ON public.affiliate_commissions(order_id);