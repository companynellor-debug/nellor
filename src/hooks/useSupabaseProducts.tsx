import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

const PAGE_SIZE = 20;

export const useSupabaseProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchProducts = useCallback(async (pageNum = 0, append = false) => {
    try {
      if (pageNum === 0) setLoading(true);
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from('products')
        .select('id, supplier_id, nome, descricao_curta, preco, estoque, categoria_id, imagens, ativo, rating_medio, total_reviews, vendas_count, tamanhos, cores, is_kit, created_at, updated_at')
        .eq('ativo', true)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const rows = (data || []) as unknown as Product[];
      setHasMore(rows.length === PAGE_SIZE);

      if (append) {
        setProducts(prev => [...prev, ...rows]);
      } else {
        setProducts(rows);
      }
      setPage(pageNum);
    } catch (error: any) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(0);
  }, [fetchProducts]);

  const loadMore = useCallback(() => {
    if (hasMore) fetchProducts(page + 1, true);
  }, [hasMore, page, fetchProducts]);

  const getProductById = (id: string) => products.find(p => p.id === id);
  const getProductsByCategory = (categoryId: string) => products.filter(p => p.categoria_id === categoryId);
  const getProductsBySupplier = (supplierId: string) => products.filter(p => p.supplier_id === supplierId);

  return {
    products,
    loading,
    hasMore,
    loadMore,
    getProductById,
    getProductsByCategory,
    getProductsBySupplier,
    refetch: () => fetchProducts(0)
  };
};
