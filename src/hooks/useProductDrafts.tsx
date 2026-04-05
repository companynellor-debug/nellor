import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProductFormData, DEFAULT_FORM_DATA } from '@/components/fornecedor/product-modal/types';

export interface ProductDraft {
  id: string;
  supplier_id: string;
  sale_type: string;
  draft_data: any;
  current_step: number;
  created_at: string;
  updated_at: string;
}

export const useProductDrafts = () => {
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDraft = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data, error } = await supabase
        .from('product_drafts')
        .select('*')
        .eq('supplier_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data) setDraft(data as any);
      else setDraft(null);
    } catch {
      setDraft(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDraft(); }, [fetchDraft]);

  const saveDraft = useCallback(async (formData: ProductFormData, currentStep: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (draft) {
        await supabase.from('product_drafts').update({
          sale_type: formData.saleType,
          draft_data: formData as any,
          current_step: currentStep,
        }).eq('id', draft.id);
      } else {
        const { data } = await supabase.from('product_drafts').insert({
          supplier_id: user.id,
          sale_type: formData.saleType,
          draft_data: formData as any,
          current_step: currentStep,
        }).select().single();
        if (data) setDraft(data as any);
      }
    } catch (err) {
      console.error('Error saving draft:', err);
    }
  }, [draft]);

  const deleteDraft = useCallback(async () => {
    if (!draft) return;
    try {
      await supabase.from('product_drafts').delete().eq('id', draft.id);
      setDraft(null);
    } catch {}
  }, [draft]);

  const restoreFormData = useCallback((): { formData: ProductFormData; step: number } | null => {
    if (!draft) return null;
    return {
      formData: { ...DEFAULT_FORM_DATA, ...(draft.draft_data as any) },
      step: draft.current_step,
    };
  }, [draft]);

  return { draft, loading, saveDraft, deleteDraft, restoreFormData, refetch: fetchDraft };
};
