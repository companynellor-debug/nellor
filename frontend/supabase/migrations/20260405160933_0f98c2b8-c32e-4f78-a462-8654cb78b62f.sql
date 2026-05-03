
CREATE TABLE IF NOT EXISTS public.product_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sale_type text NOT NULL DEFAULT 'unit',
  draft_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  current_step integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers manage own drafts"
  ON public.product_drafts
  FOR ALL
  TO authenticated
  USING (supplier_id = auth.uid())
  WITH CHECK (supplier_id = auth.uid());

CREATE TRIGGER set_product_drafts_updated_at
  BEFORE UPDATE ON public.product_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_timestamp();
