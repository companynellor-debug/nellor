-- Allow buyers to update proposals on their own quotation requests (e.g., accept/reject)
CREATE POLICY "QP: buyers can update on own request"
ON public.quotation_proposals
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.quotation_requests qr
    WHERE qr.id = quotation_proposals.request_id
      AND qr.buyer_id = auth.uid()
  )
);
