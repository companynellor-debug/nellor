-- Fixes for missing column and RLS recursion left over from the
-- migration from project juvywnnpcbhwarhwxcgc → bqobvpeggordtwbvmdgr.

-- 1) products.keywords was created via Lovable UI in the old DB and has
-- no migration. Add it idempotently so the catalog/search queries work.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS keywords text[];

-- 2) Infinite recursion between collections <-> collection_members RLS
-- The fix migration 20260309031552 created public.is_collection_owner()
-- but the patch migration that created `collections` used a different
-- policy name, so the original recursive policy is still active.
-- Re-write all relevant policies to use the SECURITY DEFINER helper.

-- Drop any existing policies that may cause recursion
DROP POLICY IF EXISTS "Users own collections"               ON public.collections;
DROP POLICY IF EXISTS "Users can view shared collections"   ON public.collections;
DROP POLICY IF EXISTS "Owners manage collection items"      ON public.collection_items;
DROP POLICY IF EXISTS "Owners manage collection members"    ON public.collection_members;
DROP POLICY IF EXISTS "Collection owners can manage members" ON public.collection_members;
DROP POLICY IF EXISTS "Members can view collection items"   ON public.collection_items;

-- Ensure helper exists
CREATE OR REPLACE FUNCTION public.is_collection_owner(_collection_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.collections c
    WHERE c.id = _collection_id
      AND c.user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_collection_member(_collection_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.collection_members cm
    WHERE cm.collection_id = _collection_id
      AND cm.user_id = _user_id
  );
$$;

-- collections: owners full access + shared members can SELECT
CREATE POLICY "Owner full access" ON public.collections
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Members can read shared collections" ON public.collections
  FOR SELECT TO authenticated
  USING (public.is_collection_member(id, auth.uid()));

-- collection_items: anyone with access to the collection
CREATE POLICY "Owners manage items" ON public.collection_items
  FOR ALL TO authenticated
  USING (public.is_collection_owner(collection_id, auth.uid()))
  WITH CHECK (public.is_collection_owner(collection_id, auth.uid()));

CREATE POLICY "Members read items" ON public.collection_items
  FOR SELECT TO authenticated
  USING (public.is_collection_member(collection_id, auth.uid()));

-- collection_members: owner manages, members can see themselves
CREATE POLICY "Owners manage members" ON public.collection_members
  FOR ALL TO authenticated
  USING (public.is_collection_owner(collection_id, auth.uid()))
  WITH CHECK (public.is_collection_owner(collection_id, auth.uid()));

CREATE POLICY "Members read own membership" ON public.collection_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
