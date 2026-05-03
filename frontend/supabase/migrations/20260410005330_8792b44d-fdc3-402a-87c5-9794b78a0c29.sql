
-- Add delivery_check_sent flag to prevent duplicate notifications
ALTER TABLE public.negotiations 
ADD COLUMN IF NOT EXISTS delivery_check_sent boolean DEFAULT false;

-- Create trigger function to notify buyer on negotiation status changes
CREATE OR REPLACE FUNCTION public.notify_negotiation_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_product_name text;
  v_event_key text;
  notification_title text;
  notification_body text;
BEGIN
  v_product_name := NEW.product_name;

  -- When supplier marks as shipped
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'shipped' THEN
    v_event_key := 'neg:shipped:' || NEW.id::text;
    INSERT INTO public.notification_sent_events (event_key) VALUES (v_event_key) ON CONFLICT (event_key) DO NOTHING;
    IF FOUND THEN
      INSERT INTO public.notifications (user_id, title, body, type, sound, data)
      VALUES (
        NEW.buyer_id,
        '🚚 Pedido Enviado!',
        'O fornecedor confirmou o envio de "' || v_product_name || '". Confirme quando receber.',
        'order_update'::public.notification_type,
        true,
        jsonb_build_object(
          'event', 'negotiation_shipped',
          'negotiation_id', NEW.id,
          'url', '/cliente/minhas-negociacoes?filtro=envio'
        )
      );
    END IF;
  END IF;

  -- When status changes to accepted
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'accepted' THEN
    v_event_key := 'neg:accepted:' || NEW.id::text;
    INSERT INTO public.notification_sent_events (event_key) VALUES (v_event_key) ON CONFLICT (event_key) DO NOTHING;
    IF FOUND THEN
      INSERT INTO public.notifications (user_id, title, body, type, sound, data)
      VALUES (
        NEW.buyer_id,
        '✅ Negociação Aceita!',
        'O fornecedor aceitou sua negociação de "' || v_product_name || '".',
        'order_update'::public.notification_type,
        true,
        jsonb_build_object(
          'event', 'negotiation_accepted',
          'negotiation_id', NEW.id,
          'url', '/cliente/minhas-negociacoes'
        )
      );
    END IF;
  END IF;

  -- When buyer confirms delivery
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'delivered' THEN
    v_event_key := 'neg:delivered:' || NEW.id::text;
    INSERT INTO public.notification_sent_events (event_key) VALUES (v_event_key) ON CONFLICT (event_key) DO NOTHING;
    IF FOUND THEN
      -- Notify supplier that buyer confirmed
      INSERT INTO public.notifications (user_id, title, body, type, sound, data)
      VALUES (
        NEW.supplier_id,
        '📦 Entrega Confirmada!',
        'O comprador confirmou o recebimento de "' || v_product_name || '".',
        'order_update'::public.notification_type,
        true,
        jsonb_build_object(
          'event', 'negotiation_delivered',
          'negotiation_id', NEW.id,
          'url', '/fornecedor/negociacoes'
        )
      );
    END IF;
  END IF;

  -- When cancelled
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'cancelled' THEN
    v_event_key := 'neg:cancelled:' || NEW.id::text;
    INSERT INTO public.notification_sent_events (event_key) VALUES (v_event_key) ON CONFLICT (event_key) DO NOTHING;
    IF FOUND THEN
      INSERT INTO public.notifications (user_id, title, body, type, sound, data)
      VALUES (
        NEW.buyer_id,
        '❌ Negociação Cancelada',
        'A negociação de "' || v_product_name || '" foi cancelada.',
        'order_update'::public.notification_type,
        true,
        jsonb_build_object(
          'event', 'negotiation_cancelled',
          'negotiation_id', NEW.id,
          'url', '/cliente/minhas-negociacoes'
        )
      );
    END IF;
  END IF;

  -- When disputed
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'disputed' THEN
    v_event_key := 'neg:disputed:' || NEW.id::text;
    INSERT INTO public.notification_sent_events (event_key) VALUES (v_event_key) ON CONFLICT (event_key) DO NOTHING;
    IF FOUND THEN
      INSERT INTO public.notifications (user_id, title, body, type, sound, data)
      VALUES (
        NEW.supplier_id,
        '⚠️ Disputa Aberta',
        'O comprador abriu uma disputa sobre "' || v_product_name || '". Responda em até 48h.',
        'alert'::public.notification_type,
        true,
        jsonb_build_object(
          'event', 'negotiation_disputed',
          'negotiation_id', NEW.id,
          'url', '/fornecedor/negociacoes'
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_notify_negotiation_changes ON public.negotiations;
CREATE TRIGGER trg_notify_negotiation_changes
  AFTER UPDATE ON public.negotiations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_negotiation_changes();
