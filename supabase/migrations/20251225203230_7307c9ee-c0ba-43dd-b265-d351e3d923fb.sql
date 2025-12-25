-- Prevent duplicate notification events

-- Ensure event_key is unique (idempotency)
CREATE UNIQUE INDEX IF NOT EXISTS notification_sent_events_event_key_uidx
ON public.notification_sent_events (event_key);

-- Recreate notify_order_changes with idempotency guard
CREATE OR REPLACE FUNCTION public.notify_order_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_title TEXT;
  notification_body TEXT;
  target_user_id UUID;
  event_key TEXT;
  notification_type TEXT := 'order_update';
BEGIN
  -- FORNECEDOR: Notificação quando pedido é criado (INSERT com payment_status = pending)
  IF TG_OP = 'INSERT' AND NEW.payment_status = 'pending' THEN
    event_key := 'order:new:' || NEW.id::text;

    INSERT INTO public.notification_sent_events (event_key)
    VALUES (event_key)
    ON CONFLICT (event_key) DO NOTHING;

    -- If already existed, skip
    IF NOT FOUND THEN
      RETURN NEW;
    END IF;

    notification_title := '📦 Novo Pedido Recebido';
    notification_body := 'Pedido #' || NEW.order_number || ' - R$ ' || ROUND(NEW.total::numeric, 2);
    target_user_id := NEW.supplier_id;

    INSERT INTO public.notifications (user_id, title, body, type, sound, data)
    VALUES (
      target_user_id,
      notification_title,
      notification_body,
      notification_type::notification_type,
      true,
      jsonb_build_object(
        'order_id', NEW.id,
        'order_number', NEW.order_number,
        'total', NEW.total
      )
    );

    RETURN NEW;
  END IF;

  -- CLIENTE: Notificações apenas para mudanças de status do pedido (não pagamento)
  IF TG_OP = 'UPDATE' AND OLD.order_status IS DISTINCT FROM NEW.order_status THEN
    event_key := 'order:status:' || NEW.id::text || ':' || COALESCE(NEW.order_status::text, 'null');

    INSERT INTO public.notification_sent_events (event_key)
    VALUES (event_key)
    ON CONFLICT (event_key) DO NOTHING;

    -- If already existed, skip
    IF NOT FOUND THEN
      RETURN NEW;
    END IF;

    target_user_id := NEW.buyer_id;

    CASE NEW.order_status
      WHEN 'preparing' THEN
        notification_title := '🎉 Pedido Confirmado!';
        notification_body := 'Seu pedido #' || NEW.order_number || ' está sendo preparado!';
      WHEN 'shipped' THEN
        notification_title := '🚚 Pedido Enviado!';
        notification_body := 'Seu pedido #' || NEW.order_number || ' está a caminho!';
      WHEN 'delivered' THEN
        notification_title := '✅ Pedido Entregue!';
        notification_body := 'Seu pedido #' || NEW.order_number || ' foi entregue!';
      WHEN 'cancelled' THEN
        notification_title := '❌ Pedido Cancelado';
        notification_body := 'Seu pedido #' || NEW.order_number || ' foi cancelado.';
      ELSE
        RETURN NEW;
    END CASE;

    INSERT INTO public.notifications (user_id, title, body, type, sound, data)
    VALUES (
      target_user_id,
      notification_title,
      notification_body,
      notification_type::notification_type,
      true,
      jsonb_build_object(
        'order_id', NEW.id,
        'order_number', NEW.order_number,
        'total', NEW.total
      )
    );
  END IF;

  RETURN NEW;
END;
$$;