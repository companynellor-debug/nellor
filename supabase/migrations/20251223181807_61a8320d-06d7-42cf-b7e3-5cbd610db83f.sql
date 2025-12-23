-- Add Stripe payment tracking columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS stripe_session_id text,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
ADD COLUMN IF NOT EXISTS stripe_payment_amount numeric,
ADD COLUMN IF NOT EXISTS platform_fee numeric,
ADD COLUMN IF NOT EXISTS supplier_amount numeric;