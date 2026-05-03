CREATE POLICY "Buyers can update proposals on their quotations"
  ON public.quotation_proposals FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.quotation_requests qr
    WHERE qr.id = request_id AND qr.buyer_id = auth.uid()
  ));