
-- Fix: UPDATE policy needs WITH CHECK that allows status change to under_review
DROP POLICY "Users can update own pending applications" ON public.supplier_applications;

CREATE POLICY "Users can update own pending applications"
ON public.supplier_applications
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND status IN ('pending', 'rejected')
)
WITH CHECK (
  user_id = auth.uid()
  AND status IN ('pending', 'rejected', 'under_review')
);
