
-- 1. TRUNCATE push_notification_logs
TRUNCATE TABLE public.push_notification_logs;

-- 2. DROP TABLES CASCADE
DROP TABLE IF EXISTS public.client_drop_products CASCADE;
DROP TABLE IF EXISTS public.client_drop_profiles CASCADE;
DROP TABLE IF EXISTS public.drop_audit_log CASCADE;
DROP TABLE IF EXISTS public.drop_orders CASCADE;
DROP TABLE IF EXISTS public.product_drop_settings CASCADE;
DROP TABLE IF EXISTS public.supplier_drop_settings CASCADE;

DROP TABLE IF EXISTS public.affiliate_commission_items CASCADE;
DROP TABLE IF EXISTS public.affiliate_commissions CASCADE;
DROP TABLE IF EXISTS public.affiliate_attributions CASCADE;
DROP TABLE IF EXISTS public.affiliate_links CASCADE;
DROP TABLE IF EXISTS public.affiliates CASCADE;
DROP TABLE IF EXISTS public.supplier_affiliate_settings CASCADE;

DROP TABLE IF EXISTS public.service_provider_contract_requests CASCADE;
DROP TABLE IF EXISTS public.service_provider_crm CASCADE;
DROP TABLE IF EXISTS public.service_provider_requests CASCADE;
DROP TABLE IF EXISTS public.service_provider_suppliers CASCADE;
DROP TABLE IF EXISTS public.supplier_service_provider_settings CASCADE;
DROP TABLE IF EXISTS public.service_providers CASCADE;

DROP TABLE IF EXISTS public.supplier_stories CASCADE;
DROP TABLE IF EXISTS public.story_views CASCADE;

DROP TABLE IF EXISTS public.sponsored_products CASCADE;
DROP TABLE IF EXISTS public.sponsorship_requests CASCADE;

DROP TABLE IF EXISTS public.quotation_proposals CASCADE;
DROP TABLE IF EXISTS public.quotation_requests CASCADE;

DROP TABLE IF EXISTS public.shared_carts CASCADE;
DROP TABLE IF EXISTS public.trend_requests CASCADE;
DROP TABLE IF EXISTS public.messages_archive CASCADE;
DROP TABLE IF EXISTS public.user_sessions CASCADE;

-- 3. DROP FUNCTIONS
DROP FUNCTION IF EXISTS public.accept_service_provider_invite(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.create_affiliate_commission_for_order(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.generate_affiliate_code() CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_affiliates() CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_service_providers() CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_sponsorship_requests() CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_commissions() CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_contract_requests() CASCADE;
DROP FUNCTION IF EXISTS public.get_drop_catalog() CASCADE;
DROP FUNCTION IF EXISTS public.get_active_attribution(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.log_drop_audit() CASCADE;
DROP FUNCTION IF EXISTS public.notify_new_sponsorship_request() CASCADE;
DROP FUNCTION IF EXISTS public.track_affiliate_click(text, uuid, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.update_affiliate_earnings(uuid, numeric) CASCADE;
DROP FUNCTION IF EXISTS public.request_supplier_integration(text) CASCADE;
DROP FUNCTION IF EXISTS public.respond_to_sp_request(uuid, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.generate_supplier_code() CASCADE;
DROP FUNCTION IF EXISTS public.generate_or_get_supplier_code(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.regenerate_supplier_code(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_collection_owner(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.decrement_stock_on_delivery() CASCADE;

-- 4. DROP ENUMS
DROP TYPE IF EXISTS public.affiliate_status CASCADE;
DROP TYPE IF EXISTS public.commission_status CASCADE;
DROP TYPE IF EXISTS public.sponsorship_type CASCADE;
DROP TYPE IF EXISTS public.sponsorship_status CASCADE;

-- 5. Função de retenção automática
CREATE OR REPLACE FUNCTION public.cleanup_old_push_logs()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM public.push_notification_logs
  WHERE created_at < now() - interval '7 days';
$$;
