-- Add paid_at timestamp for Stripe-paid orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Helpful indexes for webhook lookups
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent_id
  ON public.orders (stripe_payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id
  ON public.orders (stripe_session_id);
