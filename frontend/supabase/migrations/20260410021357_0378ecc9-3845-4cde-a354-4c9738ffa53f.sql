
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
  -- Only validate when order_status actually changes
  IF OLD.order_status IS NOT DISTINCT FROM NEW.order_status THEN
    RETURN NEW;
  END IF;

  v_uid := auth.uid();
  v_is_admin := has_role(v_uid, 'admin');

  -- Admins can do anything
  IF v_is_admin THEN
    RETURN NEW;
  END IF;

  -- === CANCELLATION RULES ===
  IF NEW.order_status = 'cancelled' THEN
    -- Block cancellation after shipping or delivery
    IF OLD.order_status IN ('shipped', 'delivered') THEN
      RAISE EXCEPTION 'Pedidos enviados ou entregues não podem ser cancelados. Abra uma disputa.';
    END IF;

    -- Buyer can only cancel if order is still pending
    IF v_uid = OLD.buyer_id THEN
      IF OLD.order_status != 'pending' THEN
        RAISE EXCEPTION 'Você só pode cancelar pedidos que ainda estão pendentes.';
      END IF;
      RETURN NEW;
    END IF;

    -- Supplier can cancel if pending or preparing (before shipping)
    IF v_uid = OLD.supplier_id THEN
      IF OLD.order_status NOT IN ('pending', 'preparing') THEN
        RAISE EXCEPTION 'Não é possível cancelar após o envio.';
      END IF;
      RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Você não tem permissão para cancelar este pedido.';
  END IF;

  -- === FORWARD TRANSITION RULES ===
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
