
-- 1. Make buckets public
UPDATE storage.buckets SET public = true WHERE id = 'payment-proofs';
UPDATE storage.buckets SET public = true WHERE id = 'invoices';

-- 2. Drop old function and recreate with new signature
DROP FUNCTION IF EXISTS public.get_admin_disputes();

CREATE OR REPLACE FUNCTION public.get_admin_disputes()
RETURNS TABLE(
  id uuid,
  negotiation_id uuid,
  buyer_id uuid,
  supplier_id uuid,
  reason text,
  description text,
  status text,
  admin_notes text,
  supplier_response text,
  supplier_responded_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz,
  buyer_name text,
  supplier_name text,
  product_name text,
  agreed_price numeric,
  payment_state text,
  payment_proof_url text,
  payment_reference text,
  payment_contested_reason text,
  payment_method text,
  quantity integer,
  buyer_data jsonb,
  invoice_url text,
  negotiation_status text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    d.id,
    d.negotiation_id,
    d.buyer_id,
    d.supplier_id,
    d.reason,
    d.description,
    d.status,
    d.admin_notes,
    d.supplier_response,
    d.supplier_responded_at,
    d.resolved_at,
    d.created_at,
    COALESCE(bp.nome, 'Comprador') as buyer_name,
    COALESCE(sp.nome, 'Fornecedor') as supplier_name,
    n.product_name,
    n.agreed_price,
    n.payment_state,
    n.payment_proof_url,
    n.payment_reference,
    n.payment_contested_reason,
    n.payment_method,
    n.quantity,
    n.buyer_data,
    n.invoice_url,
    n.status as negotiation_status
  FROM disputes d
  LEFT JOIN profiles bp ON bp.id = d.buyer_id
  LEFT JOIN profiles sp ON sp.id = d.supplier_id
  LEFT JOIN negotiations n ON n.id = d.negotiation_id
  ORDER BY d.created_at DESC;
$$;

-- 3. Admin RPC to force-resolve negotiation disputes
CREATE OR REPLACE FUNCTION public.admin_resolve_negotiation_dispute(
  p_dispute_id uuid,
  p_action text,
  p_admin_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_negotiation_id uuid;
  v_supplier_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem executar esta ação';
  END IF;

  SELECT negotiation_id, supplier_id
  INTO v_negotiation_id, v_supplier_id
  FROM disputes
  WHERE id = p_dispute_id;

  IF v_negotiation_id IS NULL THEN
    RAISE EXCEPTION 'Disputa não encontrada';
  END IF;

  IF p_action = 'force_cancel' THEN
    UPDATE negotiations SET status = 'cancelled', updated_at = now() WHERE id = v_negotiation_id;
    UPDATE disputes SET status = 'scam_confirmed', admin_notes = p_admin_notes, resolved_at = now(), updated_at = now() WHERE id = p_dispute_id;

  ELSIF p_action = 'force_continue' THEN
    UPDATE negotiations SET payment_state = 'confirmed_by_supplier', payment_confirmed_at = now(), updated_at = now() WHERE id = v_negotiation_id;
    UPDATE disputes SET status = 'resolved', admin_notes = p_admin_notes, resolved_at = now(), updated_at = now() WHERE id = p_dispute_id;

  ELSIF p_action = 'suspend_supplier' THEN
    UPDATE profiles SET ativo = false WHERE id = v_supplier_id;
    UPDATE disputes SET status = 'scam_confirmed', admin_notes = COALESCE(p_admin_notes, '') || ' [Fornecedor suspenso]', resolved_at = now(), updated_at = now() WHERE id = p_dispute_id;

  ELSE
    RAISE EXCEPTION 'Ação inválida: %', p_action;
  END IF;
END;
$$;
