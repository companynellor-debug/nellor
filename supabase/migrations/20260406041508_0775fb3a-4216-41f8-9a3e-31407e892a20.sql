
-- Create negotiations table for recording deals made via chat
CREATE TABLE public.negotiations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  agreed_price NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'pix',
  expected_delivery DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'delivered', 'disputed', 'cancelled')),
  buyer_confirmed_delivery BOOLEAN DEFAULT false,
  delivery_confirmed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.negotiations ENABLE ROW LEVEL SECURITY;

-- Buyers can view and create their own negotiations
CREATE POLICY "Buyers can view own negotiations"
  ON public.negotiations FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

CREATE POLICY "Buyers can create negotiations"
  ON public.negotiations FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Buyers can update own negotiations"
  ON public.negotiations FOR UPDATE
  TO authenticated
  USING (buyer_id = auth.uid());

-- Suppliers can view and update negotiations for their products
CREATE POLICY "Suppliers can view their negotiations"
  ON public.negotiations FOR SELECT
  TO authenticated
  USING (supplier_id = auth.uid());

CREATE POLICY "Suppliers can update their negotiations"
  ON public.negotiations FOR UPDATE
  TO authenticated
  USING (supplier_id = auth.uid());

-- Admins can manage all
CREATE POLICY "Admins can manage all negotiations"
  ON public.negotiations FOR ALL
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for performance
CREATE INDEX idx_negotiations_buyer ON public.negotiations(buyer_id);
CREATE INDEX idx_negotiations_supplier ON public.negotiations(supplier_id);
CREATE INDEX idx_negotiations_status ON public.negotiations(status);
