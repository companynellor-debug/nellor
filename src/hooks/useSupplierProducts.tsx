import { useState, useEffect, useCallback } from 'react';
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
  sizes?: string[];
  colors?: string[];
  isKit?: boolean;
  kitItems?: { name: string; quantity: number }[];
  brand?: string;
  model?: string;
  material?: string;
  gender?: string;
  ageGroup?: string;
  weightGrams?: number;
  widthCm?: number;
  heightCm?: number;
  depthCm?: number;
  condition?: string;
  ncmCode?: string;
  saleUnit?: string;
  unitsPerSaleUnit?: number;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  isCnpjOnly?: boolean;
  isInternational?: boolean;
  keywords?: string[];
  warrantyDays?: number;
  whatIsInTheBox?: string;
}

const PAGE_SIZE = 20;

export const useSupplierProducts = () => {
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  const fetchProducts = useCallback(async (pageNum = 0, append = false) => {
    try {
      if (pageNum === 0) setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from('products')
        .select('id, nome, categoria_id, descricao_curta, imagens, preco, estoque, variacoes, tamanhos, cores, is_kit, kit_items, brand, model, material, gender, age_group, weight_grams, width_cm, height_cm, depth_cm, condition, ncm_code, sale_unit, units_per_sale_unit, min_order_quantity, max_order_quantity, is_cnpj_only, is_international, keywords, warranty_days, what_is_in_the_box')
        .eq('supplier_id', user.id)
        .eq('ativo', true)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const mappedProducts = (data || []).map((product: any) => ({
        id: product.id,
        name: product.nome,
        category: product.categoria_id || '',
        description: product.descricao_curta || '',
        images: product.imagens || [],
        price: parseFloat(product.preco),
        stock: product.estoque,
        variations: product.variacoes || undefined,
        sizes: product.tamanhos || undefined,
        colors: product.cores || undefined,
        isKit: product.is_kit || false,
        kitItems: product.kit_items || undefined,
        brand: product.brand || undefined,
        model: product.model || undefined,
        material: product.material || undefined,
        gender: product.gender || 'none',
        ageGroup: product.age_group || 'none',
        weightGrams: product.weight_grams || undefined,
        widthCm: product.width_cm ? parseFloat(product.width_cm) : undefined,
        heightCm: product.height_cm ? parseFloat(product.height_cm) : undefined,
        depthCm: product.depth_cm ? parseFloat(product.depth_cm) : undefined,
        condition: product.condition || 'new',
        ncmCode: product.ncm_code || undefined,
        saleUnit: product.sale_unit || 'unit',
        unitsPerSaleUnit: product.units_per_sale_unit || 1,
        minOrderQuantity: product.min_order_quantity || 1,
        maxOrderQuantity: product.max_order_quantity || undefined,
        isCnpjOnly: product.is_cnpj_only || false,
        isInternational: product.is_international || false,
        keywords: product.keywords || [],
        warrantyDays: product.warranty_days || undefined,
        whatIsInTheBox: product.what_is_in_the_box || undefined,
      }));

      setHasMore(mappedProducts.length === PAGE_SIZE);

      if (append) {
        setProducts(prev => [...prev, ...mappedProducts]);
      } else {
        setProducts(mappedProducts);
      }
      setPage(pageNum);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({ title: 'Erro ao carregar produtos', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchProducts(0); }, [fetchProducts]);

  const loadMore = useCallback(() => {
    if (hasMore) fetchProducts(page + 1, true);
  }, [hasMore, page, fetchProducts]);

  const addProduct = async (product: Omit<SupplierProduct, 'id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('products')
        .insert([{
          supplier_id: user.id,
          nome: product.name,
          categoria_id: product.category && product.category !== '' ? product.category : null,
          descricao_curta: product.description || '',
          descricao_longa: product.description || '',
          imagens: product.images && product.images.length > 0 ? product.images : [],
          preco: product.price,
          estoque: product.stock || 0,
          variacoes: product.variations || null,
          tamanhos: product.sizes && product.sizes.length > 0 ? product.sizes : null,
          cores: product.colors && product.colors.length > 0 ? product.colors : null,
          is_kit: product.isKit || false,
          kit_items: product.kitItems && product.kitItems.length > 0 ? product.kitItems : null,
          ativo: true,
          rating_medio: 0,
          total_reviews: 0,
          brand: product.brand || null,
          model: product.model || null,
          material: product.material || null,
          gender: product.gender || 'none',
          age_group: product.ageGroup || 'none',
          weight_grams: product.weightGrams || null,
          width_cm: product.widthCm || null,
          height_cm: product.heightCm || null,
          depth_cm: product.depthCm || null,
          condition: product.condition || 'new',
          ncm_code: product.ncmCode || null,
          sale_unit: product.saleUnit || 'unit',
          units_per_sale_unit: product.unitsPerSaleUnit || 1,
          min_order_quantity: product.minOrderQuantity || 1,
          max_order_quantity: product.maxOrderQuantity || null,
          is_cnpj_only: product.isCnpjOnly || false,
          is_international: product.isInternational || false,
          keywords: product.keywords || [],
          warranty_days: product.warrantyDays || null,
          what_is_in_the_box: product.whatIsInTheBox || null,
        }])
        .select()
        .single();

      if (error) throw error;
      toast({ title: 'Produto adicionado', description: 'Produto criado com sucesso!' });
      fetchProducts(0);
      return data;
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast({ title: 'Erro ao adicionar produto', description: error.message, variant: 'destructive' });
      throw error;
    }
  };

  const updateProduct = async (id: string, updatedData: Partial<SupplierProduct>) => {
    try {
      const updatePayload: any = {};
      if (updatedData.name) updatePayload.nome = updatedData.name;
      if (updatedData.category) updatePayload.categoria_id = updatedData.category;
      if (updatedData.description !== undefined) {
        updatePayload.descricao_curta = updatedData.description;
        updatePayload.descricao_longa = updatedData.description;
      }
      if (updatedData.images) updatePayload.imagens = updatedData.images;
      if (updatedData.price !== undefined) updatePayload.preco = updatedData.price;
      if (updatedData.stock !== undefined) updatePayload.estoque = updatedData.stock;
      if (updatedData.variations) updatePayload.variacoes = updatedData.variations;
      if (updatedData.sizes !== undefined) updatePayload.tamanhos = updatedData.sizes.length > 0 ? updatedData.sizes : null;
      if (updatedData.colors !== undefined) updatePayload.cores = updatedData.colors.length > 0 ? updatedData.colors : null;
      if (updatedData.isKit !== undefined) updatePayload.is_kit = updatedData.isKit;
      if (updatedData.kitItems !== undefined) updatePayload.kit_items = updatedData.kitItems.length > 0 ? updatedData.kitItems : null;
      if (updatedData.brand !== undefined) updatePayload.brand = updatedData.brand || null;
      if (updatedData.model !== undefined) updatePayload.model = updatedData.model || null;
      if (updatedData.material !== undefined) updatePayload.material = updatedData.material || null;
      if (updatedData.gender !== undefined) updatePayload.gender = updatedData.gender;
      if (updatedData.ageGroup !== undefined) updatePayload.age_group = updatedData.ageGroup;
      if (updatedData.weightGrams !== undefined) updatePayload.weight_grams = updatedData.weightGrams || null;
      if (updatedData.widthCm !== undefined) updatePayload.width_cm = updatedData.widthCm || null;
      if (updatedData.heightCm !== undefined) updatePayload.height_cm = updatedData.heightCm || null;
      if (updatedData.depthCm !== undefined) updatePayload.depth_cm = updatedData.depthCm || null;
      if (updatedData.condition !== undefined) updatePayload.condition = updatedData.condition;
      if (updatedData.ncmCode !== undefined) updatePayload.ncm_code = updatedData.ncmCode || null;
      if (updatedData.saleUnit !== undefined) updatePayload.sale_unit = updatedData.saleUnit;
      if (updatedData.unitsPerSaleUnit !== undefined) updatePayload.units_per_sale_unit = updatedData.unitsPerSaleUnit;
      if (updatedData.minOrderQuantity !== undefined) updatePayload.min_order_quantity = updatedData.minOrderQuantity;
      if (updatedData.maxOrderQuantity !== undefined) updatePayload.max_order_quantity = updatedData.maxOrderQuantity || null;
      if (updatedData.isCnpjOnly !== undefined) updatePayload.is_cnpj_only = updatedData.isCnpjOnly;
      if (updatedData.isInternational !== undefined) updatePayload.is_international = updatedData.isInternational;
      if (updatedData.keywords !== undefined) updatePayload.keywords = updatedData.keywords;
      if (updatedData.warrantyDays !== undefined) updatePayload.warranty_days = updatedData.warrantyDays || null;
      if (updatedData.whatIsInTheBox !== undefined) updatePayload.what_is_in_the_box = updatedData.whatIsInTheBox || null;

      const { error } = await supabase.from('products').update(updatePayload).eq('id', id);
      if (error) throw error;
      toast({ title: 'Produto atualizado', description: 'Alterações salvas com sucesso!' });
      fetchProducts(0);
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast({ title: 'Erro ao atualizar produto', description: error.message, variant: 'destructive' });
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase.from('products').update({ ativo: false }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Produto excluído', description: 'Produto removido com sucesso!' });
      fetchProducts(0);
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({ title: 'Erro ao excluir produto', description: error.message, variant: 'destructive' });
    }
  };

  return { products, loading, hasMore, loadMore, addProduct, updateProduct, deleteProduct, refetch: () => fetchProducts(0) };
};
