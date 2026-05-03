
-- Create supplier_shipping_config table
CREATE TABLE IF NOT EXISTS public.supplier_shipping_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  origin_cep text,
  origin_city text,
  origin_state text,
  use_melhor_envio boolean NOT NULL DEFAULT false,
  melhor_envio_token text,
  free_shipping_above numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(supplier_id)
);

-- Add delivery days columns to supplier_shipping_regions
ALTER TABLE public.supplier_shipping_regions 
  ADD COLUMN IF NOT EXISTS delivery_days_min integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS delivery_days_max integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- Enable RLS on supplier_shipping_config
ALTER TABLE public.supplier_shipping_config ENABLE ROW LEVEL SECURITY;

-- RLS policies for supplier_shipping_config
CREATE POLICY "Suppliers can manage their own shipping config"
  ON public.supplier_shipping_config
  FOR ALL
  TO authenticated
  USING (supplier_id = auth.uid())
  WITH CHECK (supplier_id = auth.uid());

-- Allow public read for shipping calculation
CREATE POLICY "Anyone can read shipping config"
  ON public.supplier_shipping_config
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER set_updated_at_supplier_shipping_config
  BEFORE UPDATE ON public.supplier_shipping_config
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_timestamp();
