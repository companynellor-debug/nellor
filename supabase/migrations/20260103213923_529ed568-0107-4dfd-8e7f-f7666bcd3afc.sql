-- Function to get all affiliates for admin
CREATE OR REPLACE FUNCTION public.get_admin_affiliates()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  status text,
  full_name text,
  email text,
  document_type text,
  document_number text,
  registration_step integer,
  total_earnings numeric,
  pending_earnings numeric,
  stripe_ready boolean,
  created_at timestamptz,
  user_name text,
  user_email text,
  links_count bigint,
  clicks_count bigint,
  conversions_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    a.id,
    a.user_id,
    a.status::text,
    a.full_name,
    a.email,
    a.document_type,
    a.document_number,
    COALESCE(a.registration_step, 1),
    COALESCE(a.total_earnings, 0),
    COALESCE(a.pending_earnings, 0),
    COALESCE(a.stripe_ready, false),
    a.created_at,
    COALESCE(a.full_name, p.nome, 'N/A') as user_name,
    COALESCE(a.email, p.email, 'N/A') as user_email,
    COALESCE((SELECT COUNT(*) FROM affiliate_links WHERE affiliate_id = a.id), 0) as links_count,
    COALESCE((SELECT SUM(COALESCE(clicks, 0)) FROM affiliate_links WHERE affiliate_id = a.id), 0) as clicks_count,
    COALESCE((SELECT SUM(COALESCE(conversions, 0)) FROM affiliate_links WHERE affiliate_id = a.id), 0) as conversions_count
  FROM affiliates a
  LEFT JOIN profiles p ON p.id = a.user_id
  ORDER BY a.created_at DESC;
$$;

-- Function to get all service providers for admin
CREATE OR REPLACE FUNCTION public.get_admin_service_providers()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  business_name text,
  service_type text,
  status text,
  description text,
  created_at timestamptz,
  user_name text,
  user_email text,
  user_photo text,
  suppliers_count bigint,
  crm_clients_count bigint,
  pending_contracts bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    sp.id,
    sp.user_id,
    sp.business_name,
    sp.service_type,
    sp.status::text,
    sp.description,
    sp.created_at,
    COALESCE(p.nome, 'N/A') as user_name,
    COALESCE(p.email, 'N/A') as user_email,
    p.foto_perfil_url as user_photo,
    COALESCE((SELECT COUNT(*) FROM service_provider_suppliers WHERE service_provider_id = sp.id), 0) as suppliers_count,
    COALESCE((SELECT COUNT(*) FROM service_provider_crm WHERE service_provider_id = sp.id), 0) as crm_clients_count,
    COALESCE((SELECT COUNT(*) FROM service_provider_contract_requests WHERE service_provider_id = sp.id AND status = 'pending'), 0) as pending_contracts
  FROM service_providers sp
  LEFT JOIN profiles p ON p.id = sp.user_id
  ORDER BY sp.created_at DESC;
$$;

-- Function to get all affiliate commissions for admin
CREATE OR REPLACE FUNCTION public.get_admin_commissions()
RETURNS TABLE(
  id uuid,
  affiliate_id uuid,
  order_id uuid,
  amount numeric,
  commission_percent numeric,
  order_total numeric,
  status text,
  created_at timestamptz,
  paid_at timestamptz,
  affiliate_name text,
  order_number text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id,
    c.affiliate_id,
    c.order_id,
    c.amount,
    c.commission_percent,
    c.order_total,
    c.status::text,
    c.created_at,
    c.paid_at,
    COALESCE(a.full_name, p.nome, 'N/A') as affiliate_name,
    COALESCE(o.order_number, 'N/A') as order_number
  FROM affiliate_commissions c
  LEFT JOIN affiliates a ON a.id = c.affiliate_id
  LEFT JOIN profiles p ON p.id = a.user_id
  LEFT JOIN orders o ON o.id = c.order_id
  ORDER BY c.created_at DESC
  LIMIT 100;
$$;

-- Function to get all contract requests for admin
CREATE OR REPLACE FUNCTION public.get_admin_contract_requests()
RETURNS TABLE(
  id uuid,
  service_provider_id uuid,
  supplier_id uuid,
  contract_type text,
  monthly_value numeric,
  notes text,
  status text,
  rejected_reason text,
  requested_at timestamptz,
  responded_at timestamptz,
  sp_name text,
  supplier_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    cr.id,
    cr.service_provider_id,
    cr.supplier_id,
    cr.contract_type,
    cr.monthly_value,
    cr.notes,
    cr.status,
    cr.rejected_reason,
    cr.requested_at,
    cr.responded_at,
    COALESCE(sp.business_name, 'N/A') as sp_name,
    COALESCE(p.nome, 'N/A') as supplier_name
  FROM service_provider_contract_requests cr
  LEFT JOIN service_providers sp ON sp.id = cr.service_provider_id
  LEFT JOIN profiles p ON p.id = cr.supplier_id
  ORDER BY cr.requested_at DESC
  LIMIT 50;
$$;