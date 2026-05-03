-- Create notification_sent_events table for idempotency control
CREATE TABLE IF NOT EXISTS public.notification_sent_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_notification_sent_events_key ON public.notification_sent_events(event_key);

-- Clean up old events after 30 days (optional maintenance)
-- This can be done via a cron job later

-- Enable RLS
ALTER TABLE public.notification_sent_events ENABLE ROW LEVEL SECURITY;

-- Only service role can access (backend only)
CREATE POLICY "Service role only" ON public.notification_sent_events
  FOR ALL USING (false);

-- Update notify_order_changes trigger to NOT create payment notifications
-- (webhook handles those - avoiding duplicates)
CREATE OR REPLACE FUNCTION public.notify_order_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  notification_title TEXT;
  notification_body TEXT;
  order_value TEXT;
BEGIN
  order_value := 'R$ ' || NEW.total::TEXT;
  
  -- New order notification - ONLY when payment_status is pending (not paid)
  -- If order is created as 'paid', webhook handles the notification
  IF TG_OP = 'INSERT' AND NEW.payment_status != 'paid' THEN
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
  
  -- Order status change notification (NOT payment - webhook handles payment)
  IF TG_OP = 'UPDATE' AND OLD.order_status IS DISTINCT FROM NEW.order_status THEN
    -- Skip payment-related status changes (handled by webhook)
    IF NEW.order_status IN ('preparing') AND OLD.payment_status != 'paid' AND NEW.payment_status = 'paid' THEN
      -- This is a payment confirmation change - webhook handles it
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
    
    -- Only create notification for specific status changes (not preparing - that's payment)
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
  
  -- PAYMENT CONFIRMATION IS HANDLED BY WEBHOOK ONLY - NO DUPLICATES
  -- Do NOT create notification here for payment_status changes
  
  RETURN NEW;
END;
$function$;