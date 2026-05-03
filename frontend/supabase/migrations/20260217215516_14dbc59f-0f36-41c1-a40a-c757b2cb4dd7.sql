
-- Add min_order_quantity and min_order_value columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS min_order_quantity integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_order_value numeric DEFAULT 0;

-- Add banner_url column to sponsored_products if not exists
ALTER TABLE public.sponsored_products
  ADD COLUMN IF NOT EXISTS banner_url text;
