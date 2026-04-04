
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS gender text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS age_group text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS max_order_quantity integer,
  ADD COLUMN IF NOT EXISTS warranty_days integer,
  ADD COLUMN IF NOT EXISTS what_is_in_the_box text;
