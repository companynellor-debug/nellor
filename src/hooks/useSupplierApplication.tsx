import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from './useSupabaseAuth';
import { toast } from 'sonner';

export type SupplierApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected';
export type BusinessType = 'individual' | 'company';

export interface SupplierApplication {
  id: string;
  user_id: string;
  status: SupplierApplicationStatus;
  business_type: BusinessType;
  full_name: string;
  cpf: string | null;
  cnpj: string | null;
  company_name: string | null;
  phone: string;
  product_category: string | null;
  business_description: string | null;
  address_cep: string;
  address_street: string;
  address_number: string;
  address_complement: string | null;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
  document_front_url: string | null;
  document_back_url: string | null;
  selfie_url: string | null;
  extra_document_url: string | null;
  rejection_reason: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useSupplierApplication() {
  const { user } = useSupabaseAuth();
  const queryClient = useQueryClient();

  const { data: application, isLoading } = useQuery({
    queryKey: ['supplier-application', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('supplier_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as SupplierApplication | null;
    },
    enabled: !!user,
  });

  const createApplication = useMutation({
    mutationFn: async (formData: Omit<SupplierApplication, 'id' | 'user_id' | 'status' | 'document_front_url' | 'document_back_url' | 'selfie_url' | 'extra_document_url' | 'rejection_reason' | 'submitted_at' | 'reviewed_at' | 'reviewed_by' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('Não autenticado');
      
      const { data, error } = await supabase
        .from('supplier_applications')
        .insert({
          user_id: user.id,
          ...formData,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-application'] });
      toast.success('Solicitação criada! Agora envie seus documentos.');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar solicitação: ' + error.message);
    },
  });

  const uploadDocument = async (file: File, docType: string): Promise<string> => {
    if (!user) throw new Error('Não autenticado');
    
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${docType}-${Date.now()}.${ext}`;
    
    const { error } = await supabase.storage
      .from('supplier-documents')
      .upload(path, file, { upsert: true });
    
    if (error) throw error;
    
    const { data: urlData } = supabase.storage
      .from('supplier-documents')
      .getPublicUrl(path);
    
    return urlData.publicUrl;
  };

  const submitDocuments = useMutation({
    mutationFn: async (docs: {
      applicationId: string;
      documentFrontUrl: string;
      documentBackUrl: string;
      selfieUrl: string;
      extraDocumentUrl?: string;
    }) => {
      const { error } = await supabase
        .from('supplier_applications')
        .update({
          document_front_url: docs.documentFrontUrl,
          document_back_url: docs.documentBackUrl,
          selfie_url: docs.selfieUrl,
          extra_document_url: docs.extraDocumentUrl || null,
          status: 'under_review' as any,
          submitted_at: new Date().toISOString(),
        })
        .eq('id', docs.applicationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-application'] });
      toast.success('Documentos enviados para análise!');
    },
    onError: (error: any) => {
      toast.error('Erro ao enviar documentos: ' + error.message);
    },
  });

  // Can reapply if rejected and 7+ days passed
  const canReapply = (() => {
    if (!application) return true;
    if (application.status !== 'rejected') return false;
    if (!application.reviewed_at) return true;
    const reviewDate = new Date(application.reviewed_at);
    const diff = Date.now() - reviewDate.getTime();
    return diff >= 7 * 24 * 60 * 60 * 1000;
  })();

  const daysUntilReapply = (() => {
    if (!application || application.status !== 'rejected' || !application.reviewed_at) return 0;
    const reviewDate = new Date(application.reviewed_at);
    const diff = 7 * 24 * 60 * 60 * 1000 - (Date.now() - reviewDate.getTime());
    return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
  })();

  return {
    application,
    isLoading,
    createApplication,
    uploadDocument,
    submitDocuments,
    canReapply,
    daysUntilReapply,
  };
}
