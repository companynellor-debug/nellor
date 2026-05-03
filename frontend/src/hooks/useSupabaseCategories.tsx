import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Category {
  id: string;
  nome: string;
  slug: string;
  imagem_url: string | null;
  created_at: string;
  product_count?: number;
}

// Module-level cache for categories (rarely changes)
let categoriesCache: Category[] | null = null;
let lastCacheFetch = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export const useSupabaseCategories = () => {
  const [categories, setCategories] = useState<Category[]>(categoriesCache || []);
  const [loading, setLoading] = useState(!categoriesCache);
  const { toast } = useToast();

  const fetchCategories = async (force = false) => {
    if (!force && categoriesCache && Date.now() - lastCacheFetch < CACHE_TTL) {
      setCategories(categoriesCache);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [catRes, prodRes] = await Promise.all([
        supabase.from('categories').select('id, nome, slug, imagem_url, created_at').order('nome', { ascending: true }),
        supabase.from('products').select('categoria_id').eq('ativo', true),
      ]);

      if (catRes.error) throw catRes.error;

      const countMap: Record<string, number> = {};
      (prodRes.data || []).forEach((p: any) => {
        if (p.categoria_id) countMap[p.categoria_id] = (countMap[p.categoria_id] || 0) + 1;
      });

      const categoriesWithCount = (catRes.data || []).map((cat) => ({
        ...cat,
        product_count: countMap[cat.id] || 0
      }));

      categoriesCache = categoriesWithCount;
      lastCacheFetch = Date.now();
      setCategories(categoriesWithCount);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const uploadCategoryImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('categories').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('categories').getPublicUrl(fileName);
      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading category image:', error);
      toast({ title: 'Erro ao fazer upload da imagem', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const createCategory = async (categoryData: Omit<Category, 'id' | 'created_at' | 'product_count'>) => {
    try {
      const { data, error } = await supabase.from('categories').insert([categoryData]).select().single();
      if (error) throw error;
      toast({ title: 'Categoria criada', description: 'Categoria criada com sucesso' });
      categoriesCache = null;
      fetchCategories(true);
      return data;
    } catch (error: any) {
      console.error('Error creating category:', error);
      toast({ title: 'Erro ao criar categoria', description: error.message, variant: 'destructive' });
      throw error;
    }
  };

  const updateCategory = async (categoryId: string, categoryData: Partial<Omit<Category, 'id' | 'created_at' | 'product_count'>>) => {
    try {
      const { data, error } = await supabase.from('categories').update(categoryData).eq('id', categoryId).select().single();
      if (error) throw error;
      toast({ title: 'Categoria atualizada', description: 'Categoria atualizada com sucesso' });
      categoriesCache = null;
      fetchCategories(true);
      return data;
    } catch (error: any) {
      console.error('Error updating category:', error);
      toast({ title: 'Erro ao atualizar categoria', description: error.message, variant: 'destructive' });
      throw error;
    }
  };

  const deleteCategory = async (categoryId: string) => {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', categoryId);
      if (error) throw error;
      toast({ title: 'Categoria removida', description: 'Categoria removida com sucesso' });
      categoriesCache = null;
      fetchCategories(true);
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({ title: 'Erro ao remover categoria', description: error.message, variant: 'destructive' });
      throw error;
    }
  };

  return { categories, loading, createCategory, updateCategory, deleteCategory, uploadCategoryImage, refetch: () => fetchCategories(true) };
};
