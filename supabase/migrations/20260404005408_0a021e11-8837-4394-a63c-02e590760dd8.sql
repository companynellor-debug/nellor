
-- Enums para tipo de negócio e status da solicitação
CREATE TYPE public.business_type AS ENUM ('individual', 'company');
CREATE TYPE public.supplier_application_status AS ENUM ('pending', 'under_review', 'approved', 'rejected');

-- Tabela de solicitações de fornecedor
CREATE TABLE public.supplier_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status supplier_application_status NOT NULL DEFAULT 'pending',
  business_type business_type NOT NULL,
  full_name TEXT NOT NULL,
  cpf TEXT,
  cnpj TEXT,
  company_name TEXT,
  phone TEXT NOT NULL,
  product_category TEXT,
  business_description TEXT,
  address_cep TEXT NOT NULL,
  address_street TEXT NOT NULL,
  address_number TEXT NOT NULL,
  address_complement TEXT,
  address_neighborhood TEXT NOT NULL,
  address_city TEXT NOT NULL,
  address_state TEXT NOT NULL,
  document_front_url TEXT,
  document_back_url TEXT,
  selfie_url TEXT,
  extra_document_url TEXT,
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.supplier_applications ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver suas próprias solicitações
CREATE POLICY "Users can view own applications"
  ON public.supplier_applications FOR SELECT
  USING (user_id = auth.uid());

-- Usuários podem criar solicitações para si mesmos
CREATE POLICY "Users can create own applications"
  ON public.supplier_applications FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Usuários podem atualizar suas solicitações pendentes (upload de documentos)
CREATE POLICY "Users can update own pending applications"
  ON public.supplier_applications FOR UPDATE
  USING (user_id = auth.uid() AND status IN ('pending', 'rejected'));

-- Admins podem ver e gerenciar todas as solicitações
CREATE POLICY "Admins can manage all applications"
  ON public.supplier_applications FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage bucket para documentos de verificação
INSERT INTO storage.buckets (id, name, public)
VALUES ('supplier-documents', 'supplier-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Política de storage: usuários podem fazer upload de seus próprios docs
CREATE POLICY "Users can upload own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'supplier-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política de storage: usuários podem ver seus próprios docs
CREATE POLICY "Users can view own documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'supplier-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política de storage: admins podem ver todos os docs
CREATE POLICY "Admins can view all documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'supplier-documents'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- RPC para admin listar solicitações
CREATE OR REPLACE FUNCTION public.get_admin_supplier_applications()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  status supplier_application_status,
  business_type business_type,
  full_name TEXT,
  cpf TEXT,
  cnpj TEXT,
  company_name TEXT,
  phone TEXT,
  product_category TEXT,
  business_description TEXT,
  address_cep TEXT,
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  address_state TEXT,
  document_front_url TEXT,
  document_back_url TEXT,
  selfie_url TEXT,
  extra_document_url TEXT,
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  user_email TEXT,
  user_name TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sa.id, sa.user_id, sa.status, sa.business_type,
    sa.full_name, sa.cpf, sa.cnpj, sa.company_name,
    sa.phone, sa.product_category, sa.business_description,
    sa.address_cep, sa.address_street, sa.address_number,
    sa.address_complement, sa.address_neighborhood,
    sa.address_city, sa.address_state,
    sa.document_front_url, sa.document_back_url,
    sa.selfie_url, sa.extra_document_url,
    sa.rejection_reason, sa.submitted_at,
    sa.reviewed_at, sa.reviewed_by,
    sa.created_at, sa.updated_at,
    p.email AS user_email,
    p.nome AS user_name
  FROM supplier_applications sa
  LEFT JOIN profiles p ON p.id = sa.user_id
  ORDER BY sa.created_at DESC;
$$;
