
-- Add new columns
ALTER TABLE public.negotiations
ADD COLUMN IF NOT EXISTS cancel_reason text,
ADD COLUMN IF NOT EXISTS refund_state text NOT NULL DEFAULT 'none';

-- Replace the validation trigger function
CREATE OR REPLACE FUNCTION public.validate_negotiation_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only validate status changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Block cancellation after shipped (nobody can cancel)
  IF NEW.status = 'cancelled' AND OLD.status = 'shipped' THEN
    RAISE EXCEPTION 'Não é possível cancelar após o envio. Entre em contato com o administrador.';
  END IF;

  -- Block cancellation after delivered
  IF NEW.status = 'cancelled' AND OLD.status = 'delivered' THEN
    RAISE EXCEPTION 'Não é possível cancelar uma negociação já entregue.';
  END IF;

  -- Block supplier cancellation when payment is confirmed
  IF NEW.status = 'cancelled' AND OLD.payment_state = 'confirmed_by_supplier' THEN
    RAISE EXCEPTION 'Não é possível cancelar após confirmar o pagamento. Entre em contato com o administrador.';
  END IF;

  -- Require cancel_reason when supplier cancels with reported payment
  IF NEW.status = 'cancelled' AND OLD.payment_state = 'reported_by_buyer' AND (NEW.cancel_reason IS NULL OR NEW.cancel_reason = '') THEN
    RAISE EXCEPTION 'É obrigatório informar o motivo do cancelamento quando há pagamento reportado.';
  END IF;

  -- Valid transitions
  IF OLD.status = 'pending' AND NEW.status IN ('accepted', 'cancelled') THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'accepted' AND NEW.status IN ('shipped', 'cancelled') THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'shipped' AND NEW.status IN ('delivered', 'disputed') THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'delivered' THEN
    RAISE EXCEPTION 'Negociação já finalizada.';
  END IF;

  -- Allow admin to reset to pending (for dispute resolution)
  IF NEW.status = 'pending' AND OLD.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Transição de status inválida: % → %', OLD.status, NEW.status;
END;
$$;

-- Drop and recreate trigger to ensure it's active
DROP TRIGGER IF EXISTS validate_negotiation_transition ON public.negotiations;
CREATE TRIGGER validate_negotiation_transition
  BEFORE UPDATE ON public.negotiations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_negotiation_status_transition();
