import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SupplierProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  images: string[];
  price: number;
  stock: number;
  minQuantity?: number;
  minValue?: number;
  variations?: { name: string; options: string[] }[];
}

export const useSupplierProducts = () => {
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('supplier_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mapear dados do Supabase para o formato do SupplierProduct
      const mappedProducts = (data || []).map((product: any) => ({
        id: product.id,
        name: product.nome,
        category: product.categoria_id || '',
        description: product.descricao_curta || '',
        images: product.imagens || [],
        price: parseFloat(product.preco),
        stock: product.estoque,
        minQuantity: undefined,
        minValue: undefined,
        variations: product.variacoes || undefined,
      }));

      setProducts(mappedProducts);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Erro ao carregar produtos',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addProduct = async (product: Omit<SupplierProduct, 'id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('products')
        .insert([{
          supplier_id: user.id,
          nome: product.name,
          categoria_id: null, // Será vinculado depois
          descricao_curta: product.description,
          descricao_longa: product.description,
          imagens: product.images,
          preco: product.price,
          estoque: product.stock,
          variacoes: product.variations,
          ativo: true,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Produto adicionado',
        description: 'Produto criado com sucesso!',
      });

      fetchProducts();
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast({
        title: 'Erro ao adicionar produto',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updateProduct = async (id: string, updatedData: Partial<SupplierProduct>) => {
    try {
      const updatePayload: any = {};
      
      if (updatedData.name) updatePayload.nome = updatedData.name;
      if (updatedData.description) {
        updatePayload.descricao_curta = updatedData.description;
        updatePayload.descricao_longa = updatedData.description;
      }
      if (updatedData.images) updatePayload.imagens = updatedData.images;
      if (updatedData.price !== undefined) updatePayload.preco = updatedData.price;
      if (updatedData.stock !== undefined) updatePayload.estoque = updatedData.stock;
      if (updatedData.variations) updatePayload.variacoes = updatedData.variations;

      const { error } = await supabase
        .from('products')
        .update(updatePayload)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Produto atualizado',
        description: 'Alterações salvas com sucesso!',
      });

      fetchProducts();
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast({
        title: 'Erro ao atualizar produto',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Produto excluído',
        description: 'Produto removido com sucesso!',
      });

      fetchProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Erro ao excluir produto',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return {
    products,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    refetch: fetchProducts
  };
};
