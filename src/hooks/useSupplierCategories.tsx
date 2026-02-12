import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SupplierCategory {
  id: string;
  supplier_id: string;
  nome: string;
  slug: string;
  created_at: string;
}

export const useSupplierCategories = (supplierId?: string) => {
  const [categories, setCategories] = useState<SupplierCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchCategories = useCallback(async () => {
    if (!supplierId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('supplier_categories')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('nome');

      if (error) throw error;
      setCategories((data || []) as SupplierCategory[]);
    } catch (error: any) {
      console.error('Error fetching supplier categories:', error);
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = async (nome: string) => {
    if (!supplierId) return;
    const slug = nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    try {
      const { error } = await supabase
        .from('supplier_categories')
        .insert({ supplier_id: supplierId, nome, slug });

      if (error) throw error;
      toast({ title: 'Categoria adicionada!' });
      fetchCategories();
    } catch (error: any) {
      toast({ title: 'Erro ao adicionar categoria', description: error.message, variant: 'destructive' });
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('supplier_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Categoria removida!' });
      fetchCategories();
    } catch (error: any) {
      toast({ title: 'Erro ao remover categoria', description: error.message, variant: 'destructive' });
    }
  };

  return { categories, loading, addCategory, deleteCategory, refetch: fetchCategories };
};
