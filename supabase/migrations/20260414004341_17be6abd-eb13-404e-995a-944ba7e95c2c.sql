-- Truncate all test/usage data to free storage space
-- Using CASCADE to handle any foreign key dependencies

TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.orders CASCADE;
TRUNCATE TABLE public.messages CASCADE;
TRUNCATE TABLE public.activity_logs CASCADE;
TRUNCATE TABLE public.analytics CASCADE;
TRUNCATE TABLE public.login_attempts CASCADE;
TRUNCATE TABLE public.notification_sent_events CASCADE;
TRUNCATE TABLE public.phone_verification_codes CASCADE;
TRUNCATE TABLE public.reports CASCADE;
TRUNCATE TABLE public.reviews CASCADE;
TRUNCATE TABLE public.disputes CASCADE;
TRUNCATE TABLE public.negotiations CASCADE;
TRUNCATE TABLE public.product_views CASCADE;
TRUNCATE TABLE public.price_history CASCADE;
TRUNCATE TABLE public.push_notification_logs CASCADE;
TRUNCATE TABLE public.collection_items CASCADE;
TRUNCATE TABLE public.collection_members CASCADE;
TRUNCATE TABLE public.collections CASCADE;
TRUNCATE TABLE public.push_subscriptions CASCADE;
TRUNCATE TABLE public.notification_preferences CASCADE;