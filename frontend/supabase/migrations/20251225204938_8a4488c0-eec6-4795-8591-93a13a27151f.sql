-- Ajustes de notificações e status automático ao pagar

-- 1) Atualiza função de notificações para incluir dados (url/event/total) e criar notificação de pagamento confirmado para o fornecedor
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
  v_event_key TEXT;
  notification_type TEXT := 'order_update';
BEGIN
  -- FORNECEDOR: Notificação quando pedido é criado (INSERT com payment_status = pending)
  IF TG_OP = 'INSERT' AND NEW.payment_status = 'pending' THEN
    v_event_key := 'order:new:' || NEW.id::text;

    INSERT INTO public.notification_sent_events (event_key)
    VALUES (v_event_key)
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
        'total', NEW.total,
        'url', '/fornecedor/pedidos',
        'event', 'order_created'
      )
    );

    RETURN NEW;
  END IF;

  -- FORNECEDOR: Notificação quando pagamento muda para pago
  IF TG_OP = 'UPDATE' AND OLD.payment_status IS DISTINCT FROM NEW.payment_status AND NEW.payment_status = 'paid' THEN
    v_event_key := 'order:paid:' || NEW.id::text;

    INSERT INTO public.notification_sent_events (event_key)
    VALUES (v_event_key)
    ON CONFLICT (event_key) DO NOTHING;

    IF NOT FOUND THEN
      RETURN NEW;
    END IF;

    notification_title := '💳 Pagamento Confirmado';
    notification_body := 'Pedido #' || NEW.order_number || ' - R$ ' || ROUND(NEW.total::numeric, 2) || ' foi pago.';
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
        'total', NEW.total,
        'url', '/fornecedor/pedidos',
        'event', 'payment_paid'
      )
    );

    -- Não retorna aqui para não bloquear outras lógicas do trigger
  END IF;

  -- CLIENTE: Notificações apenas para mudanças de status do pedido (não pagamento)
  IF TG_OP = 'UPDATE' AND OLD.order_status IS DISTINCT FROM NEW.order_status THEN
    v_event_key := 'order:status:' || NEW.id::text || ':' || COALESCE(NEW.order_status::text, 'null');

    INSERT INTO public.notification_sent_events (event_key)
    VALUES (v_event_key)
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
        'total', NEW.total,
        'url', '/cliente/meus-pedidos',
        'event', 'order_status_changed'
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 2) Atualiza status automaticamente quando pagamento for confirmado
CREATE OR REPLACE FUNCTION public.set_order_status_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    -- Se ainda estiver pendente, avançar para "preparing" (pedido confirmado)
    IF NEW.order_status IS NULL OR NEW.order_status = 'pending' THEN
      NEW.order_status := 'preparing';
    END IF;

    -- Ajustes de labels (se usados pela UI)
    NEW.status_label := COALESCE(NEW.status_label, 'PAGAMENTO_CONFIRMADO');
    NEW.payment_status_label := 'PAGO';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_order_status_on_payment ON public.orders;
CREATE TRIGGER trg_set_order_status_on_payment
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_order_status_on_payment();