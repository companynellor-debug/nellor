
-- Helper function to format BRL currency in pt-BR style
CREATE OR REPLACE FUNCTION public.format_brl(value numeric)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT 'R$ ' || TO_CHAR(value, 'FM999G999G999D00');
$$;

-- Fix notify_order_changes to use proper formatting
CREATE OR REPLACE FUNCTION public.notify_order_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  notification_title TEXT;
  notification_body TEXT;
  target_user_id UUID;
  v_event_key TEXT;
  notification_type TEXT := 'order_update';
  v_formatted_total TEXT;
BEGIN
  v_formatted_total := public.format_brl(NEW.total::numeric);

  -- FORNECEDOR: Notificação quando pedido é criado
  IF TG_OP = 'INSERT' AND NEW.payment_status = 'pending' THEN
    v_event_key := 'order:new:' || NEW.id::text;
    INSERT INTO public.notification_sent_events (event_key) VALUES (v_event_key) ON CONFLICT (event_key) DO NOTHING;
    IF NOT FOUND THEN RETURN NEW; END IF;

    notification_title := '📦 Novo Pedido Recebido';
    notification_body := 'Pedido #' || NEW.order_number || ' - ' || v_formatted_total;
    target_user_id := NEW.supplier_id;

    INSERT INTO public.notifications (user_id, title, body, type, sound, data)
    VALUES (target_user_id, notification_title, notification_body, notification_type::notification_type, true,
      jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number, 'total', NEW.total, 'url', '/fornecedor/pedidos', 'event', 'order_created'));
    RETURN NEW;
  END IF;

  -- FORNECEDOR: Pagamento confirmado
  IF TG_OP = 'UPDATE' AND OLD.payment_status IS DISTINCT FROM NEW.payment_status AND NEW.payment_status = 'paid' THEN
    v_event_key := 'order:paid:' || NEW.id::text;
    INSERT INTO public.notification_sent_events (event_key) VALUES (v_event_key) ON CONFLICT (event_key) DO NOTHING;
    IF NOT FOUND THEN RETURN NEW; END IF;

    notification_title := '💳 Pagamento Confirmado';
    notification_body := 'Pedido #' || NEW.order_number || ' - ' || v_formatted_total || ' foi pago.';
    target_user_id := NEW.supplier_id;

    INSERT INTO public.notifications (user_id, title, body, type, sound, data)
    VALUES (target_user_id, notification_title, notification_body, notification_type::notification_type, true,
      jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number, 'total', NEW.total, 'url', '/fornecedor/pedidos', 'event', 'payment_paid'));
  END IF;

  -- CLIENTE: Mudanças de status
  IF TG_OP = 'UPDATE' AND OLD.order_status IS DISTINCT FROM NEW.order_status THEN
    v_event_key := 'order:status:' || NEW.id::text || ':' || COALESCE(NEW.order_status::text, 'null');
    INSERT INTO public.notification_sent_events (event_key) VALUES (v_event_key) ON CONFLICT (event_key) DO NOTHING;
    IF NOT FOUND THEN RETURN NEW; END IF;

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
    VALUES (target_user_id, notification_title, notification_body, notification_type::notification_type, true,
      jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number, 'total', NEW.total, 'url', '/cliente/meus-pedidos', 'event', 'order_status_changed'));
  END IF;

  RETURN NEW;
END;
$function$;

-- Fix notify_payout_changes to use proper formatting
CREATE OR REPLACE FUNCTION public.notify_payout_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_formatted_amount TEXT;
BEGIN
  v_formatted_amount := public.format_brl(NEW.amount::numeric);

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, title, body, type, sound, data)
    SELECT ur.user_id, 'Nova Solicitação de Saque', 'Fornecedor solicitou saque de ' || v_formatted_amount, 'payout', true,
      jsonb_build_object('payout_id', NEW.id, 'amount', NEW.amount)
    FROM public.user_roles ur WHERE ur.role = 'admin';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO public.notifications (user_id, title, body, type, sound, data)
    VALUES (
      NEW.supplier_id,
      CASE NEW.status WHEN 'approved' THEN 'Saque Aprovado!' WHEN 'paid' THEN 'Saque Realizado!' WHEN 'rejected' THEN 'Saque Recusado' ELSE 'Atualização de Saque' END,
      CASE NEW.status WHEN 'approved' THEN 'Seu saque de ' || v_formatted_amount || ' foi aprovado' WHEN 'paid' THEN 'Seu saque de ' || v_formatted_amount || ' foi realizado!' WHEN 'rejected' THEN 'Seu saque foi recusado. ' || COALESCE(NEW.admin_note, '') ELSE 'Status do saque atualizado' END,
      'payout', true, jsonb_build_object('payout_id', NEW.id, 'status', NEW.status, 'amount', NEW.amount));
  END IF;

  RETURN NEW;
END;
$function$;

-- Also add RLS policy for suppliers to INSERT into sponsorship_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sponsorship_requests' AND policyname = 'Suppliers can insert own sponsorship requests'
  ) THEN
    CREATE POLICY "Suppliers can insert own sponsorship requests"
    ON public.sponsorship_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (supplier_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sponsorship_requests' AND policyname = 'Suppliers can view own sponsorship requests'
  ) THEN
    CREATE POLICY "Suppliers can view own sponsorship requests"
    ON public.sponsorship_requests
    FOR SELECT
    TO authenticated
    USING (supplier_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sponsorship_requests' AND policyname = 'Admins can update sponsorship requests'
  ) THEN
    CREATE POLICY "Admins can update sponsorship requests"
    ON public.sponsorship_requests
    FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::public.app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END$$;
