-- Fix database linter: function_search_path_mutable
-- Set immutable search_path for public functions

ALTER FUNCTION public.generate_order_number() SET search_path = public;
ALTER FUNCTION public.generate_tracking_code() SET search_path = public;
ALTER FUNCTION public.notify_new_message() SET search_path = public;
ALTER FUNCTION public.notify_order_changes() SET search_path = public;
ALTER FUNCTION public.notify_payout_changes() SET search_path = public;
ALTER FUNCTION public.set_order_number() SET search_path = public;
ALTER FUNCTION public.update_product_rating() SET search_path = public;
ALTER FUNCTION public.update_product_stock() SET search_path = public;
ALTER FUNCTION public.update_supplier_analytics() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.validate_order_stock() SET search_path = public;