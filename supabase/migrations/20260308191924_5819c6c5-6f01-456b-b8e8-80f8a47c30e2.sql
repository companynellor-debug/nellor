
-- Add B2B columns to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS material text,
  ADD COLUMN IF NOT EXISTS weight_grams int,
  ADD COLUMN IF NOT EXISTS width_cm numeric,
  ADD COLUMN IF NOT EXISTS height_cm numeric,
  ADD COLUMN IF NOT EXISTS depth_cm numeric,
  ADD COLUMN IF NOT EXISTS condition text DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS ncm_code text,
  ADD COLUMN IF NOT EXISTS sale_unit text DEFAULT 'unit',
  ADD COLUMN IF NOT EXISTS units_per_sale_unit int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS min_order_quantity int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_cnpj_only boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_international boolean DEFAULT false;

-- Add check constraints
ALTER TABLE public.products
  ADD CONSTRAINT products_condition_check CHECK (condition IN ('new', 'used'));

ALTER TABLE public.products
  ADD CONSTRAINT products_sale_unit_check CHECK (sale_unit IN ('unit', 'pair', 'kit', 'closed_box', 'bale'));

-- Create product_price_tiers table
CREATE TABLE IF NOT EXISTS public.product_price_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  min_quantity int NOT NULL,
  max_quantity int,
  price_per_unit numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.product_price_tiers ENABLE ROW LEVEL SECURITY;

-- Suppliers can manage their own product tiers
CREATE POLICY "Suppliers manage own product tiers"
  ON public.product_price_tiers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.supplier_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.supplier_id = auth.uid())
  );

-- Anyone authenticated can read tiers
CREATE POLICY "Anyone can read product tiers"
  ON public.product_price_tiers
  FOR SELECT
  TO authenticated
  USING (true);

-- Add variation columns to product_variations
ALTER TABLE public.product_variations
  ADD COLUMN IF NOT EXISTS variation_type text DEFAULT 'size',
  ADD COLUMN IF NOT EXISTS variation_label text,
  ADD COLUMN IF NOT EXISTS variation_value text;

ALTER TABLE public.product_variations
  ADD CONSTRAINT product_variations_type_check CHECK (variation_type IN ('size', 'numbering', 'memory', 'volume', 'custom'));
