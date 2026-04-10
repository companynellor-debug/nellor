
-- ============================================
-- 1. Add columns to negotiations
-- ============================================
ALTER TABLE public.negotiations
  ADD COLUMN IF NOT EXISTS payment_state text NOT NULL DEFAULT 'not_reported',
  ADD COLUMN IF NOT EXISTS payment_reported_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_proof_url text,
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_contested_reason text,
  ADD COLUMN IF NOT EXISTS buyer_data jsonb,
  ADD COLUMN IF NOT EXISTS sale_unit text,
  ADD COLUMN IF NOT EXISTS unit_price numeric,
  ADD COLUMN IF NOT EXISTS invoice_url text;

-- ============================================
-- 2. Add columns to orders
-- ============================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_state text NOT NULL DEFAULT 'not_reported',
  ADD COLUMN IF NOT EXISTS payment_reported_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_proof_url text,
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_contested_reason text;

-- ============================================
-- 3. Validation trigger for negotiations
-- ============================================
CREATE OR REPLACE FUNCTION public.validate_negotiation_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid;
  v_is_admin boolean;
BEGIN
  -- Only validate when status actually changes
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    -- Allow other field updates (payment_state, etc.)
    RETURN NEW;
  END IF;

  v_uid := auth.uid();
  v_is_admin := has_role(v_uid, 'admin');

  IF v_is_admin THEN
    RETURN NEW;
  END IF;

  -- === CANCELLATION ===
  IF NEW.status = 'cancelled' THEN
    -- Block after shipping or delivery
    IF OLD.status IN ('shipped', 'delivered') THEN
      RAISE EXCEPTION 'Negociações enviadas ou entregues não podem ser canceladas. Abra uma disputa.';
    END IF;

    -- Buyer cancellation
    IF v_uid = OLD.buyer_id THEN
      IF OLD.status != 'pending' THEN
        RAISE EXCEPTION 'Você só pode cancelar negociações pendentes (antes do aceite do fornecedor).';
      END IF;
      IF OLD.payment_state != 'not_reported' THEN
        RAISE EXCEPTION 'Não é possível cancelar após informar o pagamento.';
      END IF;
      RETURN NEW;
    END IF;

    -- Supplier cancellation
    IF v_uid = OLD.supplier_id THEN
      IF OLD.status NOT IN ('pending', 'accepted') THEN
        RAISE EXCEPTION 'Não é possível cancelar após o envio.';
      END IF;
      -- ANTI-FRAUD: block if buyer reported payment
      IF OLD.payment_state != 'not_reported' THEN
        RAISE EXCEPTION 'Não é possível cancelar uma negociação com pagamento informado pelo comprador. Use a contestação.';
      END IF;
      RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Você não tem permissão para cancelar esta negociação.';
  END IF;

  -- === FORWARD TRANSITIONS ===
  IF NOT (
    (OLD.status = 'pending'   AND NEW.status = 'accepted') OR
    (OLD.status = 'accepted'  AND NEW.status = 'shipped')  OR
    (OLD.status = 'shipped'   AND NEW.status = 'delivered') OR
    (OLD.status = 'accepted'  AND NEW.status = 'disputed') OR
    (OLD.status = 'shipped'   AND NEW.status = 'disputed')
  ) THEN
    RAISE EXCEPTION 'Transição de status inválida: % → %', OLD.status, NEW.status;
  END IF;

  -- Only supplier can accept or ship
  IF NEW.status IN ('accepted', 'shipped') THEN
    IF v_uid IS NULL OR v_uid != OLD.supplier_id THEN
      RAISE EXCEPTION 'Apenas o fornecedor pode alterar para este status.';
    END IF;
  END IF;

  -- Only buyer can confirm delivery
  IF NEW.status = 'delivered' THEN
    IF v_uid IS NULL OR v_uid != OLD.buyer_id THEN
      RAISE EXCEPTION 'Apenas o comprador pode confirmar a entrega.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop old trigger if exists, create new one
DROP TRIGGER IF EXISTS validate_negotiation_transition ON public.negotiations;
CREATE TRIGGER validate_negotiation_transition
  BEFORE UPDATE ON public.negotiations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_negotiation_status_transition();

-- ============================================
-- 4. Update order trigger with payment_state check
-- ============================================
CREATE OR REPLACE FUNCTION public.validate_order_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid;
  v_is_admin boolean;
BEGIN
  IF OLD.order_status IS NOT DISTINCT FROM NEW.order_status THEN
    RETURN NEW;
  END IF;

  v_uid := auth.uid();
  v_is_admin := has_role(v_uid, 'admin');

  IF v_is_admin THEN
    RETURN NEW;
  END IF;

  -- === CANCELLATION RULES ===
  IF NEW.order_status = 'cancelled' THEN
    IF OLD.order_status IN ('shipped', 'delivered') THEN
      RAISE EXCEPTION 'Pedidos enviados ou entregues não podem ser cancelados. Abra uma disputa.';
    END IF;

    IF v_uid = OLD.buyer_id THEN
      IF OLD.order_status != 'pending' THEN
        RAISE EXCEPTION 'Você só pode cancelar pedidos que ainda estão pendentes.';
      END IF;
      IF OLD.payment_state != 'not_reported' THEN
        RAISE EXCEPTION 'Não é possível cancelar após informar o pagamento.';
      END IF;
      RETURN NEW;
    END IF;

    IF v_uid = OLD.supplier_id THEN
      IF OLD.order_status NOT IN ('pending', 'preparing') THEN
        RAISE EXCEPTION 'Não é possível cancelar após o envio.';
      END IF;
      IF OLD.payment_state != 'not_reported' THEN
        RAISE EXCEPTION 'Não é possível cancelar um pedido com pagamento informado pelo comprador. Use a contestação.';
      END IF;
      RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Você não tem permissão para cancelar este pedido.';
  END IF;

  -- === FORWARD TRANSITIONS ===
  IF NOT (
    (OLD.order_status = 'pending'   AND NEW.order_status = 'preparing') OR
    (OLD.order_status = 'preparing' AND NEW.order_status = 'shipped')   OR
    (OLD.order_status = 'shipped'   AND NEW.order_status = 'delivered')
  ) THEN
    RAISE EXCEPTION 'Transição de status inválida: % → %', OLD.order_status, NEW.order_status;
  END IF;

  IF NEW.order_status IN ('preparing', 'shipped') THEN
    IF v_uid IS NULL OR v_uid != OLD.supplier_id THEN
      RAISE EXCEPTION 'Apenas o fornecedor pode alterar para este status';
    END IF;
  END IF;

  IF NEW.order_status = 'delivered' THEN
    IF v_uid IS NULL OR v_uid != OLD.buyer_id THEN
      RAISE EXCEPTION 'Apenas o comprador pode confirmar a entrega';
    END IF;
  END IF;

  IF NEW.order_status = 'shipped' AND (NEW.tracking_code IS NULL OR NEW.tracking_code = '') THEN
    RAISE EXCEPTION 'Código de rastreio é obrigatório para marcar como enviado';
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================
-- 5. Storage buckets for invoices and payment proofs
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Policies for payment-proofs bucket
CREATE POLICY "Buyers can upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Participants can view payment proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-proofs'
  AND auth.uid() IS NOT NULL
);

-- Policies for invoices bucket
CREATE POLICY "Suppliers can upload invoices"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'invoices'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Participants can view invoices"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'invoices'
  AND auth.uid() IS NOT NULL
);
