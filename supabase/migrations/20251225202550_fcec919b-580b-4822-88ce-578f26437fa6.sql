
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
  notification_type TEXT := 'order_update';
BEGIN
  -- FORNECEDOR: Notificação quando pedido é criado (INSERT com payment_status = pending)
  IF TG_OP = 'INSERT' AND NEW.payment_status = 'pending' THEN
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
