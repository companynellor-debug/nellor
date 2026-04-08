
-- Create quotation status enum
CREATE TYPE public.quotation_status AS ENUM ('open', 'closed', 'cancelled');
CREATE TYPE public.proposal_status AS ENUM ('pending', 'accepted', 'rejected');

-- Quotation requests table
CREATE TABLE public.quotation_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'unidade',
  specs_file_url TEXT,
  category_id UUID REFERENCES public.categories(id),
  deadline TIMESTAMPTZ,
  status public.quotation_status NOT NULL DEFAULT 'open',
  proposals_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quotation proposals table
CREATE TABLE public.quotation_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.quotation_requests(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_price NUMERIC NOT NULL,
  freight NUMERIC DEFAULT 0,
  offer_validity_days INTEGER DEFAULT 7,
  notes TEXT,
  status public.proposal_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(request_id, supplier_id)
);

-- Enable RLS
ALTER TABLE public.quotation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_proposals ENABLE ROW LEVEL SECURITY;

-- RLS: quotation_requests
CREATE POLICY "Anyone authenticated can view open quotations"
  ON public.quotation_requests FOR SELECT
  TO authenticated
  USING (status = 'open' OR buyer_id = auth.uid());

CREATE POLICY "Buyers can create their own quotations"
  ON public.quotation_requests FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Buyers can update their own quotations"
  ON public.quotation_requests FOR UPDATE
  TO authenticated
  USING (buyer_id = auth.uid());

CREATE POLICY "Buyers can delete their own quotations"
  ON public.quotation_requests FOR DELETE
  TO authenticated
  USING (buyer_id = auth.uid());

-- RLS: quotation_proposals
CREATE POLICY "Suppliers can view their own proposals"
  ON public.quotation_proposals FOR SELECT
  TO authenticated
  USING (supplier_id = auth.uid());

CREATE POLICY "Buyers can view proposals for their quotations"
  ON public.quotation_proposals FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.quotation_requests qr
    WHERE qr.id = request_id AND qr.buyer_id = auth.uid()
  ));

CREATE POLICY "Suppliers can create proposals"
  ON public.quotation_proposals FOR INSERT
  TO authenticated
  WITH CHECK (supplier_id = auth.uid());

CREATE POLICY "Suppliers can update their own proposals"
  ON public.quotation_proposals FOR UPDATE
  TO authenticated
  USING (supplier_id = auth.uid());

-- Indexes
CREATE INDEX idx_quotation_requests_buyer ON public.quotation_requests(buyer_id);
CREATE INDEX idx_quotation_requests_status ON public.quotation_requests(status);
CREATE INDEX idx_quotation_requests_category ON public.quotation_requests(category_id);
CREATE INDEX idx_quotation_proposals_request ON public.quotation_proposals(request_id);
CREATE INDEX idx_quotation_proposals_supplier ON public.quotation_proposals(supplier_id);

-- Triggers for updated_at
CREATE TRIGGER update_quotation_requests_updated_at
  BEFORE UPDATE ON public.quotation_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotation_proposals_updated_at
  BEFORE UPDATE ON public.quotation_proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update proposals_count
CREATE OR REPLACE FUNCTION public.update_proposals_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.quotation_requests SET proposals_count = proposals_count + 1 WHERE id = NEW.request_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.quotation_requests SET proposals_count = GREATEST(proposals_count - 1, 0) WHERE id = OLD.request_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_update_proposals_count
  AFTER INSERT OR DELETE ON public.quotation_proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_proposals_count();
