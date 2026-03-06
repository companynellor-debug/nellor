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

export const useSupabaseCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      
      // Buscar categorias
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('nome', { ascending: true });

      if (categoriesError) throw categoriesError;

      // Buscar contagem de produtos por categoria
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('categoria_id')
        .eq('ativo', true);

      if (productsError) throw productsError;

      // Calcular contagem por categoria
      const countMap: Record<string, number> = {};
      (productsData || []).forEach((p: any) => {
        if (p.categoria_id) {
          countMap[p.categoria_id] = (countMap[p.categoria_id] || 0) + 1;
        }
      });

      // Adicionar contagem às categorias
      const categoriesWithCount = (categoriesData || []).map((cat) => ({
        ...cat,
        product_count: countMap[cat.id] || 0
      }));

      setCategories(categoriesWithCount);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const uploadCategoryImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('categories')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('categories')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading category image:', error);
      toast({
        title: 'Erro ao fazer upload da imagem',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const createCategory = async (categoryData: Omit<Category, 'id' | 'created_at' | 'product_count'>) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Categoria criada',
        description: 'Categoria criada com sucesso',
      });

      return data;
    } catch (error: any) {
      console.error('Error creating category:', error);
      toast({
        title: 'Erro ao criar categoria',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateCategory = async (categoryId: string, categoryData: Partial<Omit<Category, 'id' | 'created_at' | 'product_count'>>) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', categoryId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Categoria atualizada',
        description: 'Categoria atualizada com sucesso',
      });

      return data;
    } catch (error: any) {
      console.error('Error updating category:', error);
      toast({
        title: 'Erro ao atualizar categoria',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteCategory = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: 'Categoria removida',
        description: 'Categoria removida com sucesso',
      });
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Erro ao remover categoria',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    uploadCategoryImage,
    refetch: fetchCategories
  };
};
