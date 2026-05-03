-- Fix core marketplace flow: triggers, realtime, and push_subscriptions uniqueness

-- 1) Ensure orders changes are emitted with full row data (realtime)
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Add tables to realtime publication (safe if already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- 2) Make push_subscriptions upsert-safe (used by the frontend)
-- Creates a unique constraint for (user_id, endpoint)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'push_subscriptions_user_endpoint_key'
  ) THEN
    ALTER TABLE public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_endpoint_key UNIQUE (user_id, endpoint);
  END IF;
END $$;

-- 3) Create triggers (they are currently missing)
-- Orders
DO $$
BEGIN
  -- Validate stock before insert
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_orders_validate_stock') THEN
    CREATE TRIGGER trg_orders_validate_stock
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_order_stock();
  END IF;

  -- Auto order number
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_orders_set_order_number') THEN
    CREATE TRIGGER trg_orders_set_order_number
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.set_order_number();
  END IF;

  -- Auto tracking code when shipped
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_orders_generate_tracking_code') THEN
    CREATE TRIGGER trg_orders_generate_tracking_code
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_tracking_code();
  END IF;

  -- updated_at
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_orders_updated_at') THEN
    CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  -- Notifications on insert/update (DB notifications table)
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_orders_notify_changes') THEN
    CREATE TRIGGER trg_orders_notify_changes
    AFTER INSERT OR UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_order_changes();
  END IF;

  -- Stock update when payment confirmed
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_orders_update_stock') THEN
    CREATE TRIGGER trg_orders_update_stock
    AFTER UPDATE OF payment_status ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_product_stock();
  END IF;

  -- Supplier analytics update when payment confirmed
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_orders_update_supplier_analytics') THEN
    CREATE TRIGGER trg_orders_update_supplier_analytics
    AFTER UPDATE OF payment_status ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_supplier_analytics();
  END IF;
END $$;

-- Messages
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_messages_notify_new_message') THEN
    CREATE TRIGGER trg_messages_notify_new_message
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_new_message();
  END IF;
END $$;

-- Payouts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_payouts_notify_changes') THEN
    CREATE TRIGGER trg_payouts_notify_changes
    AFTER INSERT OR UPDATE ON public.payouts
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_payout_changes();
  END IF;
END $$;

-- Reviews (keep product rating in sync)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_reviews_update_product_rating') THEN
    CREATE TRIGGER trg_reviews_update_product_rating
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_product_rating();
  END IF;
END $$;
