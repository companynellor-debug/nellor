-- Update notify_order_changes function to include total in notification data
CREATE OR REPLACE FUNCTION public.notify_order_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  notification_title TEXT;
  notification_body TEXT;
BEGIN
  -- New order notification to supplier
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, title, body, type, sound, data)
    VALUES (
      NEW.supplier_id,
      'Novo Pedido Recebido!',
      'Você recebeu um novo pedido #' || NEW.order_number,
      'order_update',
      true,
      jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number, 'total', NEW.total)
    );
    
    -- Notification to buyer
    INSERT INTO public.notifications (user_id, title, body, type, sound, data)
    VALUES (
      NEW.buyer_id,
      'Pedido Criado!',
      'Seu pedido #' || NEW.order_number || ' foi criado com sucesso',
      'order_update',
      true,
      jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number, 'total', NEW.total)
    );
  END IF;
  
  -- Order status change notification
  IF TG_OP = 'UPDATE' AND OLD.order_status != NEW.order_status THEN
    notification_title := CASE NEW.order_status
      WHEN 'preparing' THEN 'Pedido em Preparação'
      WHEN 'shipped' THEN 'Pedido Enviado!'
      WHEN 'delivered' THEN 'Pedido Entregue!'
      WHEN 'cancelled' THEN 'Pedido Cancelado'
      ELSE 'Atualização do Pedido'
    END;
    
    notification_body := CASE NEW.order_status
      WHEN 'preparing' THEN 'Seu pedido #' || NEW.order_number || ' está sendo preparado'
      WHEN 'shipped' THEN 'Seu pedido #' || NEW.order_number || ' foi enviado! Código: ' || COALESCE(NEW.tracking_code, 'N/A')
      WHEN 'delivered' THEN 'Seu pedido #' || NEW.order_number || ' foi entregue!'
      WHEN 'cancelled' THEN 'Seu pedido #' || NEW.order_number || ' foi cancelado'
      ELSE 'Status atualizado para: ' || NEW.order_status
    END;
    
    INSERT INTO public.notifications (user_id, title, body, type, sound, data)
    VALUES (
      NEW.buyer_id,
      notification_title,
      notification_body,
      'order_update',
      true,
      jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number, 'status', NEW.order_status, 'total', NEW.total)
    );
  END IF;
  
  -- Payment confirmation notification
  IF TG_OP = 'UPDATE' AND OLD.payment_status != NEW.payment_status AND NEW.payment_status = 'paid' THEN
    INSERT INTO public.notifications (user_id, title, body, type, sound, data)
    VALUES (
      NEW.supplier_id,
      'Pagamento Confirmado!',
      'Pagamento do pedido #' || NEW.order_number || ' foi confirmado',
      'order_update',
      true,
      jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number, 'total', NEW.total)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;