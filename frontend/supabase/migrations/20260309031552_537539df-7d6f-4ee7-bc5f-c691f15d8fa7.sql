-- Fix infinite recursion in RLS policies between collections <-> collection_members

-- Helper: check ownership without triggering RLS recursion
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

-- Replace policy that referenced collections directly (causing recursion)
DROP POLICY IF EXISTS "Collection owners can manage members" ON public.collection_members;

CREATE POLICY "Collection owners can manage members"
ON public.collection_members
FOR ALL
TO authenticated
USING (public.is_collection_owner(collection_id, auth.uid()))
WITH CHECK (public.is_collection_owner(collection_id, auth.uid()));
