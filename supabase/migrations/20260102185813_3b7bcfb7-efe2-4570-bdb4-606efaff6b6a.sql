-- 1. Add service_provider_code to profiles for suppliers to generate codes
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS service_provider_code TEXT UNIQUE;

-- 2. Create table for service provider integration requests
CREATE TABLE IF NOT EXISTS public.service_provider_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(service_provider_id, supplier_id)
);

-- Enable RLS
ALTER TABLE public.service_provider_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_provider_requests

-- Suppliers can view requests sent to them
CREATE POLICY "Suppliers can view their requests"
ON public.service_provider_requests
FOR SELECT
USING (supplier_id = auth.uid());

-- Suppliers can update (approve/reject) requests sent to them
CREATE POLICY "Suppliers can update their requests"
ON public.service_provider_requests
FOR UPDATE
USING (supplier_id = auth.uid());

-- Service providers can view their own requests
CREATE POLICY "Service providers can view their requests"
ON public.service_provider_requests
FOR SELECT
USING (service_provider_id IN (
  SELECT id FROM public.service_providers WHERE user_id = auth.uid()
));

-- Service providers can create requests
CREATE POLICY "Service providers can create requests"
ON public.service_provider_requests
FOR INSERT
WITH CHECK (service_provider_id IN (
  SELECT id FROM public.service_providers WHERE user_id = auth.uid()
));

-- Admins can manage all requests
CREATE POLICY "Admins can manage all requests"
ON public.service_provider_requests
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to generate a unique supplier code
CREATE OR REPLACE FUNCTION public.generate_supplier_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  result := 'FORN-';
  FOR i IN 1..5 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Function for supplier to generate/regenerate their code
CREATE OR REPLACE FUNCTION public.generate_or_get_supplier_code(_supplier_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_code TEXT;
  new_code TEXT;
  attempts INTEGER := 0;
BEGIN
  -- Check if user is the supplier
  IF auth.uid() != _supplier_id THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;
  
  -- Check if supplier already has a code
  SELECT service_provider_code INTO existing_code
  FROM public.profiles
  WHERE id = _supplier_id;
  
  IF existing_code IS NOT NULL THEN
    RETURN existing_code;
  END IF;
  
  -- Generate new unique code
  LOOP
    new_code := public.generate_supplier_code();
    
    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE service_provider_code = new_code) THEN
      UPDATE public.profiles
      SET service_provider_code = new_code
      WHERE id = _supplier_id;
      RETURN new_code;
    END IF;
    
    attempts := attempts + 1;
    IF attempts > 10 THEN
      RAISE EXCEPTION 'Não foi possível gerar código único';
    END IF;
  END LOOP;
END;
$$;

-- Function to regenerate supplier code
CREATE OR REPLACE FUNCTION public.regenerate_supplier_code(_supplier_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  attempts INTEGER := 0;
BEGIN
  -- Check if user is the supplier
  IF auth.uid() != _supplier_id THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;
  
  -- Generate new unique code
  LOOP
    new_code := public.generate_supplier_code();
    
    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE service_provider_code = new_code) THEN
      UPDATE public.profiles
      SET service_provider_code = new_code
      WHERE id = _supplier_id;
      RETURN new_code;
    END IF;
    
    attempts := attempts + 1;
    IF attempts > 10 THEN
      RAISE EXCEPTION 'Não foi possível gerar código único';
    END IF;
  END LOOP;
END;
$$;

-- Function to request integration by code
CREATE OR REPLACE FUNCTION public.request_supplier_integration(_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supplier_id UUID;
  v_sp_id UUID;
  v_sp_allows BOOLEAN;
  v_existing_request UUID;
  v_existing_link UUID;
BEGIN
  -- Find supplier by code
  SELECT id INTO v_supplier_id
  FROM public.profiles
  WHERE service_provider_code = _code
    AND tipo = 'fornecedor';
  
  IF v_supplier_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'CODIGO_INVALIDO', 'message', 'Código de fornecedor não encontrado');
  END IF;
  
  -- Check if supplier allows service providers
  SELECT COALESCE(allow_service_providers, false) INTO v_sp_allows
  FROM public.supplier_service_provider_settings
  WHERE supplier_id = v_supplier_id;
  
  IF NOT COALESCE(v_sp_allows, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NAO_PERMITIDO', 'message', 'Este fornecedor não aceita prestadores de serviço');
  END IF;
  
  -- Get service provider id for current user
  SELECT id INTO v_sp_id
  FROM public.service_providers
  WHERE user_id = auth.uid();
  
  IF v_sp_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NAO_PRESTADOR', 'message', 'Você precisa ser um prestador de serviços');
  END IF;
  
  -- Check if already linked
  SELECT id INTO v_existing_link
  FROM public.service_provider_suppliers
  WHERE service_provider_id = v_sp_id
    AND supplier_id = v_supplier_id;
  
  IF v_existing_link IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'JA_VINCULADO', 'message', 'Você já está vinculado a este fornecedor');
  END IF;
  
  -- Check if request already exists
  SELECT id INTO v_existing_request
  FROM public.service_provider_requests
  WHERE service_provider_id = v_sp_id
    AND supplier_id = v_supplier_id
    AND status = 'pending';
  
  IF v_existing_request IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'JA_SOLICITADO', 'message', 'Você já possui uma solicitação pendente para este fornecedor');
  END IF;
  
  -- Create request
  INSERT INTO public.service_provider_requests (service_provider_id, supplier_id, status)
  VALUES (v_sp_id, v_supplier_id, 'pending');
  
  -- Notify supplier (create notification)
  INSERT INTO public.notifications (user_id, title, body, type, sound, data)
  VALUES (
    v_supplier_id,
    'Nova Solicitação de Prestador',
    'Um prestador de serviços deseja gerenciar sua loja',
    'alert',
    true,
    jsonb_build_object('type', 'service_provider_request', 'service_provider_id', v_sp_id)
  );
  
  RETURN jsonb_build_object('ok', true, 'message', 'Solicitação enviada com sucesso');
END;
$$;

-- Function to approve/reject request
CREATE OR REPLACE FUNCTION public.respond_to_sp_request(_request_id UUID, _approve BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
  v_sp_user_id UUID;
BEGIN
  -- Get request and verify ownership
  SELECT * INTO v_request
  FROM public.service_provider_requests
  WHERE id = _request_id
    AND supplier_id = auth.uid()
    AND status = 'pending';
  
  IF v_request.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NAO_ENCONTRADO', 'message', 'Solicitação não encontrada ou já respondida');
  END IF;
  
  IF _approve THEN
    -- Update request status
    UPDATE public.service_provider_requests
    SET status = 'approved', responded_at = now(), updated_at = now()
    WHERE id = _request_id;
    
    -- Create the link
    INSERT INTO public.service_provider_suppliers (service_provider_id, supplier_id)
    VALUES (v_request.service_provider_id, v_request.supplier_id)
    ON CONFLICT DO NOTHING;
    
    -- Notify service provider
    SELECT user_id INTO v_sp_user_id
    FROM public.service_providers
    WHERE id = v_request.service_provider_id;
    
    INSERT INTO public.notifications (user_id, title, body, type, sound, data)
    VALUES (
      v_sp_user_id,
      'Solicitação Aprovada!',
      'Sua solicitação de integração foi aprovada',
      'alert',
      true,
      jsonb_build_object('type', 'sp_request_approved', 'supplier_id', v_request.supplier_id)
    );
    
    RETURN jsonb_build_object('ok', true, 'message', 'Solicitação aprovada e vínculo criado');
  ELSE
    -- Reject
    UPDATE public.service_provider_requests
    SET status = 'rejected', responded_at = now(), updated_at = now()
    WHERE id = _request_id;
    
    -- Notify service provider
    SELECT user_id INTO v_sp_user_id
    FROM public.service_providers
    WHERE id = v_request.service_provider_id;
    
    INSERT INTO public.notifications (user_id, title, body, type, sound, data)
    VALUES (
      v_sp_user_id,
      'Solicitação Recusada',
      'Sua solicitação de integração foi recusada',
      'alert',
      true,
      jsonb_build_object('type', 'sp_request_rejected', 'supplier_id', v_request.supplier_id)
    );
    
    RETURN jsonb_build_object('ok', true, 'message', 'Solicitação recusada');
  END IF;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER set_service_provider_requests_updated_at
BEFORE UPDATE ON public.service_provider_requests
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();