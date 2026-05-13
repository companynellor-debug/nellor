-- Patch migration: recreates tables originally created via the Supabase
-- dashboard (Lovable) that have no historical migration files.
-- Safe to run multiple times.

-- collections + collection_items + collection_members + price_history

-- Enum used by collection_items
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'collection_item_type') THEN
    CREATE TYPE public.collection_item_type AS ENUM ('product', 'supplier');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  is_public boolean DEFAULT false,
  share_token text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.collection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  reference_id uuid NOT NULL,
  type public.collection_item_type NOT NULL,
  added_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collection_items_collection
  ON public.collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_ref
  ON public.collection_items(reference_id, type);

CREATE TABLE IF NOT EXISTS public.collection_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  added_at timestamptz DEFAULT now(),
  UNIQUE (collection_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_collection_members_user
  ON public.collection_members(user_id);

-- price_history
CREATE TABLE IF NOT EXISTS public.price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  variation_id uuid,
  price numeric NOT NULL,
  recorded_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_history_product
  ON public.price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_variation
  ON public.price_history(variation_id);

-- RLS basics (later migrations may refine policies)
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own collections" ON public.collections;
CREATE POLICY "Users own collections" ON public.collections
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Owners manage collection items" ON public.collection_items;
CREATE POLICY "Owners manage collection items" ON public.collection_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid()));

DROP POLICY IF EXISTS "Owners manage collection members" ON public.collection_members;
CREATE POLICY "Owners manage collection members" ON public.collection_members
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid()));

DROP POLICY IF EXISTS "Public read price history" ON public.price_history;
CREATE POLICY "Public read price history" ON public.price_history
  FOR SELECT TO anon, authenticated USING (true);
