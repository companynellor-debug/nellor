
-- Table for tracking product page views
CREATE TABLE public.product_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  visitor_fingerprint text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_views_product_id ON public.product_views(product_id);
CREATE INDEX idx_product_views_created_at ON public.product_views(created_at);

ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a view (anon + authenticated)
CREATE POLICY "Anyone can insert product views"
  ON public.product_views FOR INSERT
  WITH CHECK (true);

-- Suppliers can read views on their own products
CREATE POLICY "Suppliers can view their product views"
  ON public.product_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_views.product_id
        AND p.supplier_id = auth.uid()
    )
  );

-- RPC to get aggregated views for a supplier
CREATE OR REPLACE FUNCTION public.get_supplier_product_views(_supplier_id uuid)
RETURNS TABLE(total_views bigint, views_last_30_days bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*) AS total_views,
    COUNT(*) FILTER (WHERE pv.created_at > now() - interval '30 days') AS views_last_30_days
  FROM public.product_views pv
  JOIN public.products p ON p.id = pv.product_id
  WHERE p.supplier_id = _supplier_id;
$$;
