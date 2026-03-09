-- 1) Shipping table used by useSupplierShipping()
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shipping_region') THEN
    CREATE TYPE public.shipping_region AS ENUM ('norte','nordeste','centro_oeste','sudeste','sul');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.supplier_shipping_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL,
  region public.shipping_region NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  free_above numeric NULL,
  allows_pickup boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (supplier_id, region)
);

-- Optional FK to profiles (keeps data consistent, safe because we never reference auth.users)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema='public'
      AND table_name='supplier_shipping_regions'
      AND constraint_name='supplier_shipping_regions_supplier_id_fkey'
  ) THEN
    ALTER TABLE public.supplier_shipping_regions
      ADD CONSTRAINT supplier_shipping_regions_supplier_id_fkey
      FOREIGN KEY (supplier_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE public.supplier_shipping_regions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read supplier shipping" ON public.supplier_shipping_regions;
CREATE POLICY "Public can read supplier shipping"
ON public.supplier_shipping_regions
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Suppliers can insert own shipping" ON public.supplier_shipping_regions;
CREATE POLICY "Suppliers can insert own shipping"
ON public.supplier_shipping_regions
FOR INSERT
TO authenticated
WITH CHECK (supplier_id = auth.uid());

DROP POLICY IF EXISTS "Suppliers can update own shipping" ON public.supplier_shipping_regions;
CREATE POLICY "Suppliers can update own shipping"
ON public.supplier_shipping_regions
FOR UPDATE
TO authenticated
USING (supplier_id = auth.uid());

DROP POLICY IF EXISTS "Suppliers can delete own shipping" ON public.supplier_shipping_regions;
CREATE POLICY "Suppliers can delete own shipping"
ON public.supplier_shipping_regions
FOR DELETE
TO authenticated
USING (supplier_id = auth.uid());

-- timestamps
DROP TRIGGER IF EXISTS trg_supplier_shipping_regions_updated_at ON public.supplier_shipping_regions;
CREATE TRIGGER trg_supplier_shipping_regions_updated_at
BEFORE UPDATE ON public.supplier_shipping_regions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- 2) Fix collections policy (shared collections not showing)
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view shared collections" ON public.collections;
CREATE POLICY "Users can view shared collections"
ON public.collections
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.collection_members cm
    WHERE cm.collection_id = collections.id
      AND cm.user_id = auth.uid()
  )
);
