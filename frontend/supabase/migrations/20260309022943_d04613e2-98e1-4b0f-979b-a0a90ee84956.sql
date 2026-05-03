
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS shipping_city text,
  ADD COLUMN IF NOT EXISTS shipping_state text,
  ADD COLUMN IF NOT EXISTS store_slug text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_store_slug ON public.profiles (store_slug) WHERE store_slug IS NOT NULL;
