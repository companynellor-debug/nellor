-- Attach existing helper functions as triggers (public schema only)

-- Ensure order_number is set
DROP TRIGGER IF EXISTS trg_orders_set_order_number ON public.orders;
CREATE TRIGGER trg_orders_set_order_number
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_order_number();

-- Validate stock at order creation
DROP TRIGGER IF EXISTS trg_orders_validate_stock ON public.orders;
CREATE TRIGGER trg_orders_validate_stock
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.validate_order_stock();

-- When payment becomes paid, set order_status/labels
DROP TRIGGER IF EXISTS trg_orders_set_status_on_payment ON public.orders;
CREATE TRIGGER trg_orders_set_status_on_payment
BEFORE UPDATE OF payment_status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_order_status_on_payment();

-- Auto-generate tracking code when shipped
DROP TRIGGER IF EXISTS trg_orders_generate_tracking_code ON public.orders;
CREATE TRIGGER trg_orders_generate_tracking_code
BEFORE UPDATE OF order_status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.generate_tracking_code();

-- Update updated_at automatically
DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- After payment is confirmed, update product stock
DROP TRIGGER IF EXISTS trg_orders_update_product_stock ON public.orders;
CREATE TRIGGER trg_orders_update_product_stock
AFTER UPDATE OF payment_status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_product_stock();

-- After payment is confirmed, update supplier analytics
DROP TRIGGER IF EXISTS trg_orders_update_supplier_analytics ON public.orders;
CREATE TRIGGER trg_orders_update_supplier_analytics
AFTER UPDATE OF payment_status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_supplier_analytics();

-- After payment is confirmed, increment product sales count
DROP TRIGGER IF EXISTS trg_orders_update_product_sales_count ON public.orders;
CREATE TRIGGER trg_orders_update_product_sales_count
AFTER UPDATE OF payment_status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_product_sales_count();

-- Create in-app notifications on key order changes
DROP TRIGGER IF EXISTS trg_orders_notify_changes ON public.orders;
CREATE TRIGGER trg_orders_notify_changes
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_order_changes();

-- Send push notification when a notification row is inserted
DROP TRIGGER IF EXISTS trg_notifications_send_push ON public.notifications;
CREATE TRIGGER trg_notifications_send_push
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.send_push_on_notification();

-- Notify user on new message
DROP TRIGGER IF EXISTS trg_messages_notify_new_message ON public.messages;
CREATE TRIGGER trg_messages_notify_new_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_message();

-- Payout change notifications
DROP TRIGGER IF EXISTS trg_payouts_notify_changes ON public.payouts;
CREATE TRIGGER trg_payouts_notify_changes
AFTER INSERT OR UPDATE ON public.payouts
FOR EACH ROW
EXECUTE FUNCTION public.notify_payout_changes();

-- Product rating stats based on reviews
DROP TRIGGER IF EXISTS trg_reviews_update_product_stats ON public.reviews;
CREATE TRIGGER trg_reviews_update_product_stats
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_product_review_stats();
