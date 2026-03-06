import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Product {
  id: string;
  supplier_id: string;
  nome: string;
  descricao_curta: string | null;
  descricao_longa: string | null;
  preco: number;
  estoque: number;
  categoria_id: string | null;
  variacoes: any;
  imagens: string[];
  ativo: boolean;
  rating_medio: number;
  total_reviews: number;
  vendas_count: number;
  peso: number | null;
  dimensoes: any;
  tamanhos: string[] | null;
  cores: string[] | null;
  is_kit: boolean | null;
  kit_items: any[] | null;
  created_at: string;
  updated_at: string;
}

export const useSupabaseProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('ativo', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts((data || []) as unknown as Product[]);
    } catch (error: any) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const getProductById = (id: string) => {
    return products.find(p => p.id === id);
  };

  const getProductsByCategory = (categoryId: string) => {
    return products.filter(p => p.categoria_id === categoryId);
  };

  const getProductsBySupplier = (supplierId: string) => {
    return products.filter(p => p.supplier_id === supplierId);
  };

  return {
    products,
    loading,
    getProductById,
    getProductsByCategory,
    getProductsBySupplier,
    refetch: fetchProducts
  };
};
