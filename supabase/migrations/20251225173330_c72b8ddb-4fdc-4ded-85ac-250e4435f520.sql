-- Drop and recreate the notify_order_changes function
-- ONLY create notifications for: shipped, delivered, cancelled
-- Payment notifications are handled EXCLUSIVELY by webhook

CREATE OR REPLACE FUNCTION public.notify_order_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  notification_title TEXT;
  notification_body TEXT;
  order_value TEXT;
BEGIN
  order_value := 'R$ ' || NEW.total::TEXT;
  
  -- NEW ORDER NOTIFICATION - Only when payment_status is NOT paid
  -- (paid orders are created by webhook which handles its own notifications)
  IF TG_OP = 'INSERT' AND NEW.payment_status = 'pending' THEN
    -- Notification to supplier (order created, awaiting payment)
    INSERT INTO public.notifications (user_id, title, body, type, sound, data)
    VALUES (
      NEW.supplier_id,
      '📦 Novo Pedido Recebido',
      'Pedido #' || NEW.order_number || ' - ' || order_value || ' aguardando pagamento',
      'order_update',
      true,
      jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number, 'total', NEW.total, 'event', 'order_created')
    );
    
    -- Notification to buyer
    IF NEW.buyer_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, type, sound, data)
      VALUES (
        NEW.buyer_id,
        '📦 Pedido Criado!',
        'Seu pedido #' || NEW.order_number || ' - ' || order_value || ' foi criado com sucesso',
        'order_update',
        true,
        jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number, 'total', NEW.total, 'event', 'order_created')
      );
    END IF;
  END IF;
  
  -- ORDER STATUS CHANGES - ONLY for shipped, delivered, cancelled
  -- NEVER for 'preparing' (that's payment confirmation - handled by webhook)
  IF TG_OP = 'UPDATE' AND OLD.order_status IS DISTINCT FROM NEW.order_status THEN
    -- SKIP preparing - webhook handles payment notifications
    IF NEW.order_status = 'preparing' THEN
      RETURN NEW;
    END IF;
    
    notification_title := CASE NEW.order_status
      WHEN 'shipped' THEN '🚚 Pedido Enviado!'
      WHEN 'delivered' THEN '✅ Pedido Entregue!'
      WHEN 'cancelled' THEN '❌ Pedido Cancelado'
      ELSE NULL
    END;
    
    notification_body := CASE NEW.order_status
      WHEN 'shipped' THEN 'Seu pedido #' || NEW.order_number || ' - ' || order_value || ' foi enviado! Código: ' || COALESCE(NEW.tracking_code, 'Em breve')
      WHEN 'delivered' THEN 'Seu pedido #' || NEW.order_number || ' - ' || order_value || ' foi entregue!'
      WHEN 'cancelled' THEN 'Seu pedido #' || NEW.order_number || ' - ' || order_value || ' foi cancelado'
      ELSE NULL
    END;
    
    -- Create notification ONLY for shipped/delivered/cancelled
    IF notification_title IS NOT NULL AND NEW.buyer_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, type, sound, data)
      VALUES (
        NEW.buyer_id,
        notification_title,
        notification_body,
        'order_update',
        true,
        jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number, 'status', NEW.order_status, 'total', NEW.total, 'event', 'status_' || NEW.order_status)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;