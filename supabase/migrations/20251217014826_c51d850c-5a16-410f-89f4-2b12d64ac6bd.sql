-- Admin data access functions (SECURITY DEFINER to bypass RLS)

-- Get all orders for admin
CREATE OR REPLACE FUNCTION public.get_admin_orders()
RETURNS TABLE (
  id uuid,
  order_number text,
  buyer_id uuid,
  supplier_id uuid,
  total numeric,
  subtotal numeric,
  frete numeric,
  desconto numeric,
  payment_status text,
  order_status text,
  payment_method text,
  tracking_code text,
  created_at timestamptz,
  updated_at timestamptz,
  endereco_entrega jsonb,
  itens jsonb,
  proof_url text,
  supplier_name text,
  buyer_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    o.id,
    o.order_number,
    o.buyer_id,
    o.supplier_id,
    o.total,
    o.subtotal,
    o.frete,
    o.desconto,
    o.payment_status::text,
    o.order_status::text,
    o.payment_method::text,
    o.tracking_code,
    o.created_at,
    o.updated_at,
    o.endereco_entrega,
    o.itens,
    o.proof_url,
    sp.nome as supplier_name,
    bp.nome as buyer_name
  FROM orders o
  LEFT JOIN profiles sp ON o.supplier_id = sp.id
  LEFT JOIN profiles bp ON o.buyer_id = bp.id
  ORDER BY o.created_at DESC;
$$;

-- Get all profiles for admin
CREATE OR REPLACE FUNCTION public.get_admin_profiles()
RETURNS TABLE (
  id uuid,
  nome text,
  email text,
  tipo text,
  telefone text,
  ativo boolean,
  created_at timestamptz,
  onboarding_completed boolean,
  stripe_account_id text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    nome,
    email,
    tipo::text,
    telefone,
    COALESCE(ativo, true),
    created_at,
    COALESCE(onboarding_completed, false),
    stripe_account_id
  FROM profiles
  ORDER BY created_at DESC;
$$;

-- Get admin dashboard stats
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS TABLE (
  total_users bigint,
  active_suppliers bigint,
  total_orders bigint,
  paid_orders bigint,
  delivered_orders bigint,
  total_revenue numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (SELECT COUNT(*) FROM profiles) as total_users,
    (SELECT COUNT(*) FROM profiles WHERE tipo = 'fornecedor' AND COALESCE(ativo, true) = true) as active_suppliers,
    (SELECT COUNT(*) FROM orders) as total_orders,
    (SELECT COUNT(*) FROM orders WHERE payment_status = 'paid' AND order_status != 'cancelled') as paid_orders,
    (SELECT COUNT(*) FROM orders WHERE order_status = 'delivered') as delivered_orders,
    (SELECT COALESCE(SUM(total), 0) FROM orders WHERE payment_status = 'paid' AND order_status != 'cancelled') as total_revenue;
$$;

-- Get support tickets for admin
CREATE OR REPLACE FUNCTION public.get_admin_support_tickets()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  assunto text,
  mensagem text,
  status text,
  resposta_admin text,
  created_at timestamptz,
  updated_at timestamptz,
  user_name text,
  user_email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    st.id,
    st.user_id,
    st.assunto,
    st.mensagem,
    st.status::text,
    st.resposta_admin,
    st.created_at,
    st.updated_at,
    p.nome as user_name,
    p.email as user_email
  FROM support_tickets st
  LEFT JOIN profiles p ON st.user_id = p.id
  ORDER BY st.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_orders() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_profiles() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_support_tickets() TO anon, authenticated;