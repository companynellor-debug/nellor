
CREATE OR REPLACE FUNCTION public.validate_order_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid;
BEGIN
  -- Only validate when order_status actually changes
  IF OLD.order_status IS NOT DISTINCT FROM NEW.order_status THEN
    RETURN NEW;
  END IF;

  v_uid := auth.uid();

  -- Allow cancellation from any state
  IF NEW.order_status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  -- Validate transition sequence
  IF NOT (
    (OLD.order_status = 'pending'   AND NEW.order_status = 'preparing') OR
    (OLD.order_status = 'preparing' AND NEW.order_status = 'shipped')   OR
    (OLD.order_status = 'shipped'   AND NEW.order_status = 'delivered')
  ) THEN
    RAISE EXCEPTION 'Transição de status inválida: % → %', OLD.order_status, NEW.order_status;
  END IF;

  -- Only supplier can set preparing or shipped
  IF NEW.order_status IN ('preparing', 'shipped') THEN
    IF v_uid IS NULL OR v_uid != OLD.supplier_id THEN
      RAISE EXCEPTION 'Apenas o fornecedor pode alterar para este status';
    END IF;
  END IF;

  -- Only buyer can set delivered
  IF NEW.order_status = 'delivered' THEN
    IF v_uid IS NULL OR v_uid != OLD.buyer_id THEN
      RAISE EXCEPTION 'Apenas o comprador pode confirmar a entrega';
    END IF;
  END IF;

  -- Require tracking_code when shipping
  IF NEW.order_status = 'shipped' AND (NEW.tracking_code IS NULL OR NEW.tracking_code = '') THEN
    RAISE EXCEPTION 'Código de rastreio é obrigatório para marcar como enviado';
  END IF;

  RETURN NEW;
END;
$$;

-- Drop if exists to avoid duplicate
DROP TRIGGER IF EXISTS trg_validate_order_status ON public.orders;

CREATE TRIGGER trg_validate_order_status
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_order_status_transition();
