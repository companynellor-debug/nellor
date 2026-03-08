
-- Product variations table for color/size combinations with individual stock
CREATE TABLE public.product_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  color TEXT,
  color_hex TEXT,
  size TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  price NUMERIC,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX idx_product_variations_product_id ON public.product_variations(product_id);

-- Enable RLS
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;

-- Suppliers can manage their own product variations
CREATE POLICY "Suppliers can manage own product variations"
  ON public.product_variations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.products p 
      WHERE p.id = product_variations.product_id 
      AND p.supplier_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p 
      WHERE p.id = product_variations.product_id 
      AND p.supplier_id = auth.uid()
    )
  );

-- Anyone can read active product variations
CREATE POLICY "Anyone can read product variations"
  ON public.product_variations
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.products p 
      WHERE p.id = product_variations.product_id 
      AND p.ativo = true
    )
  );

-- Trigger for updated_at
CREATE TRIGGER set_product_variations_updated_at
  BEFORE UPDATE ON public.product_variations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
