
-- Create sponsorship types
DO $$ BEGIN
  CREATE TYPE public.sponsorship_type AS ENUM ('produto_destaque', 'banner_homepage');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.sponsorship_status AS ENUM ('pending', 'approved', 'rejected', 'scheduled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create sponsorship_requests table
CREATE TABLE IF NOT EXISTS public.sponsorship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL,
  type public.sponsorship_type NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  banner_image_url TEXT,
  message TEXT,
  status public.sponsorship_status DEFAULT 'pending',
  admin_response TEXT,
  scheduled_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sponsorship_requests ENABLE ROW LEVEL SECURITY;

-- Suppliers can view their own
CREATE POLICY "Suppliers can view own sponsorship requests"
ON public.sponsorship_requests FOR SELECT
TO authenticated
USING (supplier_id = auth.uid());

-- Suppliers can create their own
CREATE POLICY "Suppliers can create sponsorship requests"
ON public.sponsorship_requests FOR INSERT
TO authenticated
WITH CHECK (supplier_id = auth.uid());

-- Admins can manage all
CREATE POLICY "Admins can manage all sponsorship requests"
ON public.sponsorship_requests FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add tour_completed column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tour_completed BOOLEAN DEFAULT false;
