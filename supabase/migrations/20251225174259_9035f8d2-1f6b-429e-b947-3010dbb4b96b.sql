-- Update notify_order_changes: 
-- FORNECEDOR: notificação de pedido criado (INSERT pending)
-- CLIENTE: APENAS mudanças de status (preparing, shipped, delivered) - NÃO para criação

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
  
  -- ================================================================
  -- NOVO PEDIDO CRIADO (INSERT com pending)
  -- APENAS notifica o FORNECEDOR - cliente não recebe aqui
  -- ================================================================
  IF TG_OP = 'INSERT' AND NEW.payment_status = 'pending' THEN
    -- Notification ONLY to supplier (order created, awaiting payment)
    INSERT INTO public.notifications (user_id, title, body, type, sound, data)
    VALUES (
      NEW.supplier_id,
      '📦 Novo Pedido Recebido',
      'Pedido #' || NEW.order_number || ' - ' || order_value || ' aguardando pagamento',
      'order_update',
      true,
      jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number, 'total', NEW.total, 'event', 'order_created')
    );
    -- Cliente NÃO recebe notificação de pedido criado (apenas quando status muda)
  END IF;
  
  -- ================================================================
  -- MUDANÇA DE STATUS DO PEDIDO
  -- Cliente recebe: preparing, shipped, delivered, cancelled
  -- ================================================================
  IF TG_OP = 'UPDATE' AND OLD.order_status IS DISTINCT FROM NEW.order_status THEN
    
    notification_title := CASE NEW.order_status
      WHEN 'preparing' THEN '🎉 Pedido Confirmado!'
      WHEN 'shipped' THEN '🚚 Pedido Enviado!'
      WHEN 'delivered' THEN '✅ Pedido Entregue!'
      WHEN 'cancelled' THEN '❌ Pedido Cancelado'
      ELSE NULL
    END;
    
    notification_body := CASE NEW.order_status
      WHEN 'preparing' THEN 'Seu pedido #' || NEW.order_number || ' - ' || order_value || ' foi confirmado e está sendo preparado!'
      WHEN 'shipped' THEN 'Seu pedido #' || NEW.order_number || ' - ' || order_value || ' foi enviado! Código: ' || COALESCE(NEW.tracking_code, 'Em breve')
      WHEN 'delivered' THEN 'Seu pedido #' || NEW.order_number || ' - ' || order_value || ' foi entregue!'
      WHEN 'cancelled' THEN 'Seu pedido #' || NEW.order_number || ' - ' || order_value || ' foi cancelado'
      ELSE NULL
    END;
    
    -- Notifica CLIENTE apenas para mudanças de status
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