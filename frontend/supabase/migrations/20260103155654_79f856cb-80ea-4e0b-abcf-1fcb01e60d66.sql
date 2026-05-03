-- Add registration data columns to affiliates table for step-by-step signup
ALTER TABLE public.affiliates
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS document_type text CHECK (document_type IN ('cpf', 'cnpj')),
ADD COLUMN IF NOT EXISTS document_number text,
ADD COLUMN IF NOT EXISTS registration_step integer DEFAULT 1;

-- Add comment
COMMENT ON COLUMN public.affiliates.registration_step IS '1=info, 2=document, 3=stripe, 4=complete';

-- Create table for service provider contract approvals
CREATE TABLE IF NOT EXISTS public.service_provider_contract_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_provider_id uuid NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL,
  contract_type text NOT NULL CHECK (contract_type IN ('single', 'monthly')),
  monthly_value numeric,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejected_reason text,
  requested_at timestamp with time zone NOT NULL DEFAULT now(),
  responded_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_provider_contract_requests ENABLE ROW LEVEL SECURITY;

-- Policies for service providers
CREATE POLICY "Service providers can create contract requests"
ON public.service_provider_contract_requests
FOR INSERT
WITH CHECK (
  service_provider_id IN (
    SELECT id FROM service_providers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Service providers can view their contract requests"
ON public.service_provider_contract_requests
FOR SELECT
USING (
  service_provider_id IN (
    SELECT id FROM service_providers WHERE user_id = auth.uid()
  )
);

-- Policies for suppliers
CREATE POLICY "Suppliers can view their contract requests"
ON public.service_provider_contract_requests
FOR SELECT
USING (supplier_id = auth.uid());

CREATE POLICY "Suppliers can update their contract requests"
ON public.service_provider_contract_requests
FOR UPDATE
USING (supplier_id = auth.uid());

-- Admin policy
CREATE POLICY "Admins can manage all contract requests"
ON public.service_provider_contract_requests
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));