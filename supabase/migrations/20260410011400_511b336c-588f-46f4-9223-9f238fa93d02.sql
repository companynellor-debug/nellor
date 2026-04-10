
-- Anti-fraud trigger: enforce minimum time intervals between negotiation status transitions
CREATE OR REPLACE FUNCTION public.validate_negotiation_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _elapsed INTERVAL;
  _caller_id uuid := auth.uid();
BEGIN
  -- Only validate when status actually changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Admins bypass all checks
  IF has_role(_caller_id, 'admin') THEN
    RETURN NEW;
  END IF;

  -- === Valid transition matrix ===
  -- pending -> accepted, cancelled
  -- accepted -> shipped, cancelled
  -- shipped -> delivered, disputed, cancelled (cancelled only by admin above)
  -- delivered -> (terminal)
  -- disputed -> (only admin can resolve)
  -- cancelled -> (terminal)

  IF OLD.status = 'pending' AND NEW.status NOT IN ('accepted', 'cancelled') THEN
    RAISE EXCEPTION 'Transição inválida: pending só pode ir para accepted ou cancelled';
  END IF;

  IF OLD.status = 'accepted' AND NEW.status NOT IN ('shipped', 'cancelled') THEN
    RAISE EXCEPTION 'Transição inválida: accepted só pode ir para shipped ou cancelled';
  END IF;

  IF OLD.status = 'shipped' AND NEW.status NOT IN ('delivered', 'disputed') THEN
    RAISE EXCEPTION 'Transição inválida: shipped só pode ir para delivered ou disputed';
  END IF;

  IF OLD.status IN ('delivered', 'cancelled', 'disputed') THEN
    RAISE EXCEPTION 'Transição inválida: status "%" é terminal', OLD.status;
  END IF;

  -- === Role enforcement ===
  -- Only supplier can accept or ship
  IF NEW.status IN ('accepted', 'shipped') AND _caller_id != OLD.supplier_id THEN
    RAISE EXCEPTION 'Apenas o fornecedor pode aceitar ou marcar envio';
  END IF;

  -- Only buyer can confirm delivery
  IF NEW.status = 'delivered' AND _caller_id != OLD.buyer_id THEN
    RAISE EXCEPTION 'Apenas o comprador pode confirmar a entrega';
  END IF;

  -- Only buyer can open dispute
  IF NEW.status = 'disputed' AND _caller_id != OLD.buyer_id THEN
    RAISE EXCEPTION 'Apenas o comprador pode abrir disputa';
  END IF;

  -- === Minimum time intervals ===

  -- pending -> accepted: min 1 hour since created_at
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    _elapsed := now() - OLD.created_at;
    IF _elapsed < INTERVAL '1 hour' THEN
      RAISE EXCEPTION 'Aguarde pelo menos 1 hora antes de aceitar a negociação. Tempo restante: %',
        (INTERVAL '1 hour' - _elapsed);
    END IF;
  END IF;

  -- accepted -> shipped: min 24 hours since updated_at (when it was accepted)
  IF OLD.status = 'accepted' AND NEW.status = 'shipped' THEN
    _elapsed := now() - OLD.updated_at;
    IF _elapsed < INTERVAL '24 hours' THEN
      RAISE EXCEPTION 'Aguarde pelo menos 24 horas após aceitar antes de marcar envio. Tempo restante: %',
        (INTERVAL '24 hours' - _elapsed);
    END IF;
  END IF;

  -- shipped -> delivered: min 48 hours since shipping_confirmed_at
  IF OLD.status = 'shipped' AND NEW.status = 'delivered' THEN
    IF OLD.shipping_confirmed_at IS NULL THEN
      RAISE EXCEPTION 'Data de envio não registrada';
    END IF;
    _elapsed := now() - OLD.shipping_confirmed_at;
    IF _elapsed < INTERVAL '48 hours' THEN
      RAISE EXCEPTION 'Aguarde pelo menos 48 horas após o envio para confirmar entrega. Tempo restante: %',
        (INTERVAL '48 hours' - _elapsed);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_validate_negotiation_transition ON public.negotiations;

-- Create the trigger
CREATE TRIGGER trg_validate_negotiation_transition
  BEFORE UPDATE ON public.negotiations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_negotiation_transition();
