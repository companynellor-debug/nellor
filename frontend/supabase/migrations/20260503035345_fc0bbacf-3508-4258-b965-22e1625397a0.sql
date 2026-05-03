
-- Sistema de Solicitações (RFQ) cliente -> fornecedores
CREATE TABLE IF NOT EXISTS public.quotation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  category text,
  quantity integer NOT NULL DEFAULT 1,
  budget_max numeric,
  deadline date,
  city text,
  state text,
  status text NOT NULL DEFAULT 'open',
  proposals_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_qr_buyer ON public.quotation_requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_qr_status_created ON public.quotation_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qr_category ON public.quotation_requests(category);

ALTER TABLE public.quotation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "QR: open requests viewable by suppliers"
  ON public.quotation_requests FOR SELECT
  USING (
    status = 'open'
    OR buyer_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "QR: buyers can insert"
  ON public.quotation_requests FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "QR: buyers can update own"
  ON public.quotation_requests FOR UPDATE
  USING (buyer_id = auth.uid());

CREATE POLICY "QR: buyers can delete own"
  ON public.quotation_requests FOR DELETE
  USING (buyer_id = auth.uid());

CREATE POLICY "QR: admins manage all"
  ON public.quotation_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Propostas dos fornecedores
CREATE TABLE IF NOT EXISTS public.quotation_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.quotation_requests(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL,
  unit_price numeric NOT NULL,
  total_price numeric,
  delivery_days integer,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(request_id, supplier_id)
);

CREATE INDEX IF NOT EXISTS idx_qp_request ON public.quotation_proposals(request_id);
CREATE INDEX IF NOT EXISTS idx_qp_supplier ON public.quotation_proposals(supplier_id);

ALTER TABLE public.quotation_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "QP: supplier sees own proposals"
  ON public.quotation_proposals FOR SELECT
  USING (
    supplier_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.quotation_requests qr WHERE qr.id = request_id AND qr.buyer_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "QP: suppliers create own"
  ON public.quotation_proposals FOR INSERT
  WITH CHECK (
    supplier_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.tipo = 'fornecedor'::user_type)
  );

CREATE POLICY "QP: suppliers update own"
  ON public.quotation_proposals FOR UPDATE
  USING (supplier_id = auth.uid());

CREATE POLICY "QP: suppliers delete own"
  ON public.quotation_proposals FOR DELETE
  USING (supplier_id = auth.uid());

CREATE POLICY "QP: admins manage all"
  ON public.quotation_proposals FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar proposals_count
CREATE OR REPLACE FUNCTION public.update_quotation_proposals_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.quotation_requests
       SET proposals_count = proposals_count + 1, updated_at = now()
     WHERE id = NEW.request_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.quotation_requests
       SET proposals_count = GREATEST(proposals_count - 1, 0), updated_at = now()
     WHERE id = OLD.request_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_quotation_proposals_count ON public.quotation_proposals;
CREATE TRIGGER trg_quotation_proposals_count
AFTER INSERT OR DELETE ON public.quotation_proposals
FOR EACH ROW EXECUTE FUNCTION public.update_quotation_proposals_count();

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_qr_updated_at ON public.quotation_requests;
CREATE TRIGGER trg_qr_updated_at
BEFORE UPDATE ON public.quotation_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_qp_updated_at ON public.quotation_proposals;
CREATE TRIGGER trg_qp_updated_at
BEFORE UPDATE ON public.quotation_proposals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RPC: dados de comprador para fornecedor visualizar quem postou
CREATE OR REPLACE FUNCTION public.get_quotation_buyer_info(_buyer_ids uuid[])
RETURNS TABLE(id uuid, nome text, foto_perfil_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.nome, p.foto_perfil_url
  FROM public.profiles p
  WHERE p.id = ANY(_buyer_ids);
$$;
