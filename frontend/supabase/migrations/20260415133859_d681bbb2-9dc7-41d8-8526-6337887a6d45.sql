
ALTER TABLE public.supplier_subscriptions
ADD COLUMN IF NOT EXISTS max_products integer NULL;

CREATE TABLE IF NOT EXISTS public.supplier_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  method text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, method)
);

ALTER TABLE public.supplier_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read supplier payment methods"
  ON public.supplier_payment_methods FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Suppliers can manage own payment methods"
  ON public.supplier_payment_methods FOR ALL
  TO authenticated
  USING (supplier_id = auth.uid())
  WITH CHECK (supplier_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.supplier_shipping_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  method text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, method)
);

ALTER TABLE public.supplier_shipping_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read supplier shipping methods"
  ON public.supplier_shipping_methods FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Suppliers can manage own shipping methods"
  ON public.supplier_shipping_methods FOR ALL
  TO authenticated
  USING (supplier_id = auth.uid())
  WITH CHECK (supplier_id = auth.uid());
