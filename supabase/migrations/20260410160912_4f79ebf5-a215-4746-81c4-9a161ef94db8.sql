
-- STEP 1: DROP ALL TRIGGERS on orders that reference payment_status
DROP TRIGGER IF EXISTS trg_orders_set_status_on_payment ON public.orders;
DROP TRIGGER IF EXISTS trg_set_order_status_on_payment ON public.orders;
DROP TRIGGER IF EXISTS trg_orders_update_product_stock ON public.orders;
DROP TRIGGER IF EXISTS trg_orders_update_stock ON public.orders;
DROP TRIGGER IF EXISTS update_stock_on_payment ON public.orders;
DROP TRIGGER IF EXISTS trg_orders_update_supplier_analytics ON public.orders;
DROP TRIGGER IF EXISTS update_analytics_trigger ON public.orders;
DROP TRIGGER IF EXISTS orders_on_paid_create_affiliate_commission ON public.orders;
DROP TRIGGER IF EXISTS trg_orders_update_product_sales_count ON public.orders;
DROP TRIGGER IF EXISTS trg_update_product_sales_count ON public.orders;
DROP TRIGGER IF EXISTS trg_update_sales_count ON public.orders;
DROP TRIGGER IF EXISTS order_notification_trigger ON public.orders;
DROP TRIGGER IF EXISTS generate_tracking_trigger ON public.orders;
DROP TRIGGER IF EXISTS set_order_number_trigger ON public.orders;

-- STEP 2: DROP LEGACY FUNCTIONS
DROP FUNCTION IF EXISTS public.set_order_status_on_payment() CASCADE;
DROP FUNCTION IF EXISTS public.update_product_stock() CASCADE;
DROP FUNCTION IF EXISTS public.update_supplier_analytics() CASCADE;
DROP FUNCTION IF EXISTS public.notify_payout_changes() CASCADE;
DROP FUNCTION IF EXISTS public.trg_on_order_paid_create_affiliate_commission() CASCADE;

-- STEP 3: DROP TRIGGERS on legacy tables
DROP TRIGGER IF EXISTS update_payouts_updated_at ON public.payouts;
DROP TRIGGER IF EXISTS payout_notification_trigger ON public.payouts;
DROP TRIGGER IF EXISTS trg_payouts_notify_changes ON public.payouts;
DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON public.payment_methods;

-- STEP 4: DROP LEGACY TABLES
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.refund_requests CASCADE;
DROP TABLE IF EXISTS public.payment_methods CASCADE;
DROP TABLE IF EXISTS public.payouts CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;

-- STEP 5: DROP COLUMNS
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS stripe_account_id,
  DROP COLUMN IF EXISTS stripe_ready,
  DROP COLUMN IF EXISTS pix_key;

ALTER TABLE public.orders
  DROP COLUMN IF EXISTS stripe_session_id,
  DROP COLUMN IF EXISTS stripe_payment_intent_id,
  DROP COLUMN IF EXISTS stripe_payment_amount,
  DROP COLUMN IF EXISTS platform_fee,
  DROP COLUMN IF EXISTS supplier_amount,
  DROP COLUMN IF EXISTS payment_status,
  DROP COLUMN IF EXISTS payment_status_label,
  DROP COLUMN IF EXISTS status_label,
  DROP COLUMN IF EXISTS paid_at;

ALTER TABLE public.drop_orders
  DROP COLUMN IF EXISTS platform_fee,
  DROP COLUMN IF EXISTS supplier_amount,
  DROP COLUMN IF EXISTS payment_status,
  DROP COLUMN IF EXISTS paid_at;

-- STEP 6: DROP ENUM
DROP TYPE IF EXISTS public.payment_status CASCADE;

-- STEP 7: RECREATE SALES COUNT TRIGGER on order_status
CREATE TRIGGER trg_orders_update_product_sales_count
  AFTER INSERT OR UPDATE OF order_status OR DELETE
  ON public.orders FOR EACH ROW
  EXECUTE FUNCTION public.update_product_sales_count();

-- STEP 8: UPDATE notify_order_changes (same return type, just body change)
CREATE OR REPLACE FUNCTION public.notify_order_changes()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  notification_title TEXT; notification_body TEXT; target_user_id UUID;
  v_event_key TEXT; notification_type TEXT := 'order_update'; v_formatted_total TEXT;
BEGIN
  v_formatted_total := public.format_brl(NEW.total::numeric);
  IF TG_OP = 'INSERT' THEN
    v_event_key := 'order:new:' || NEW.id::text;
    INSERT INTO public.notification_sent_events (event_key) VALUES (v_event_key) ON CONFLICT (event_key) DO NOTHING;
    IF NOT FOUND THEN RETURN NEW; END IF;
    INSERT INTO public.notifications (user_id, title, body, type, sound, data)
    VALUES (NEW.supplier_id, '📦 Novo Pedido Recebido', 'Pedido #' || NEW.order_number || ' - ' || v_formatted_total,
      notification_type::notification_type, true,
      jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number, 'total', NEW.total, 'url', '/fornecedor/pedidos', 'event', 'order_created'));
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.order_status IS DISTINCT FROM NEW.order_status THEN
    v_event_key := 'order:status:' || NEW.id::text || ':' || COALESCE(NEW.order_status::text, 'null');
    INSERT INTO public.notification_sent_events (event_key) VALUES (v_event_key) ON CONFLICT (event_key) DO NOTHING;
    IF NOT FOUND THEN RETURN NEW; END IF;
    target_user_id := NEW.buyer_id;
    CASE NEW.order_status
      WHEN 'preparing' THEN notification_title := '🎉 Pedido Confirmado!'; notification_body := 'Seu pedido #' || NEW.order_number || ' está sendo preparado!';
      WHEN 'shipped' THEN notification_title := '🚚 Pedido Enviado!'; notification_body := 'Seu pedido #' || NEW.order_number || ' está a caminho!';
      WHEN 'delivered' THEN notification_title := '✅ Pedido Entregue!'; notification_body := 'Seu pedido #' || NEW.order_number || ' foi entregue!';
      WHEN 'cancelled' THEN notification_title := '❌ Pedido Cancelado'; notification_body := 'Seu pedido #' || NEW.order_number || ' foi cancelado.';
      ELSE RETURN NEW;
    END CASE;
    INSERT INTO public.notifications (user_id, title, body, type, sound, data)
    VALUES (target_user_id, notification_title, notification_body, notification_type::notification_type, true,
      jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number, 'total', NEW.total, 'url', '/cliente/meus-pedidos', 'event', 'order_status_changed'));
  END IF;
  RETURN NEW;
END;
$function$;

-- STEP 9: DROP + RECREATE functions with changed return types
DROP FUNCTION IF EXISTS public.get_admin_orders();
CREATE FUNCTION public.get_admin_orders()
 RETURNS TABLE(id uuid, order_number text, buyer_id uuid, supplier_id uuid, total numeric, subtotal numeric, frete numeric, desconto numeric, order_status text, payment_method text, tracking_code text, created_at timestamptz, updated_at timestamptz, endereco_entrega jsonb, itens jsonb, proof_url text, supplier_name text, buyer_name text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT o.id, o.order_number, o.buyer_id, o.supplier_id, o.total, o.subtotal, o.frete, o.desconto,
    o.order_status::text, o.payment_method::text, o.tracking_code, o.created_at, o.updated_at,
    o.endereco_entrega, o.itens, o.proof_url, sp.nome, bp.nome
  FROM orders o LEFT JOIN profiles sp ON o.supplier_id = sp.id LEFT JOIN profiles bp ON o.buyer_id = bp.id
  ORDER BY o.created_at DESC;
$function$;

DROP FUNCTION IF EXISTS public.get_admin_stats();
CREATE FUNCTION public.get_admin_stats()
 RETURNS TABLE(total_users bigint, active_suppliers bigint, total_orders bigint, total_revenue numeric)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT (SELECT COUNT(*) FROM profiles), (SELECT COUNT(*) FROM profiles WHERE tipo = 'fornecedor' AND COALESCE(ativo, true) = true),
    (SELECT COUNT(*) FROM orders WHERE order_status != 'cancelled'), (SELECT COALESCE(SUM(total), 0) FROM orders WHERE order_status != 'cancelled');
$function$;

DROP FUNCTION IF EXISTS public.get_admin_profiles();
CREATE FUNCTION public.get_admin_profiles()
 RETURNS TABLE(id uuid, nome text, email text, tipo text, telefone text, ativo boolean, created_at timestamptz, onboarding_completed boolean)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT id, nome, email, tipo::text, telefone, COALESCE(ativo, true), created_at, COALESCE(onboarding_completed, false)
  FROM profiles ORDER BY created_at DESC;
$function$;

-- STEP 10: MESSAGES ARCHIVE
CREATE TABLE IF NOT EXISTS public.messages_archive (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id text NOT NULL, from_user uuid NOT NULL, to_user uuid NOT NULL,
  text text NOT NULL, attachments text[] DEFAULT NULL, read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(), archived_at timestamptz DEFAULT now()
);
ALTER TABLE public.messages_archive ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read archived messages" ON public.messages_archive FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- STEP 11: INDEXES
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at);
CREATE INDEX IF NOT EXISTS idx_negotiations_supplier_id ON public.negotiations (supplier_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_buyer_id ON public.negotiations (buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON public.orders (buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_supplier_id ON public.orders (supplier_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON public.products (supplier_id);
CREATE INDEX IF NOT EXISTS idx_messages_archive_chat_id ON public.messages_archive (chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_archive_created_at ON public.messages_archive (created_at);
