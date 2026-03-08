import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProductVariation {
  id: string;
  product_id: string;
  color: string | null;
  color_hex: string | null;
  size: string | null;
  stock: number;
  price: number | null;
  image_url: string | null;
}

export const useProductVariations = (productId?: string) => {
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVariations = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_variations')
        .select('*')
        .eq('product_id', productId)
        .order('color', { ascending: true })
        .order('size', { ascending: true });

      if (error) throw error;
      setVariations((data || []) as unknown as ProductVariation[]);
    } catch (err) {
      console.error('Error fetching variations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariations();
  }, [productId]);

  const saveVariations = async (productId: string, newVariations: Omit<ProductVariation, 'id' | 'product_id'>[]) => {
    try {
      // Delete existing
      await supabase.from('product_variations').delete().eq('product_id', productId);

      if (newVariations.length === 0) return;

      const rows = newVariations.map(v => ({
        product_id: productId,
        color: v.color,
        color_hex: v.color_hex,
        size: v.size,
        stock: v.stock,
        price: v.price,
        image_url: v.image_url,
      }));

      const { error } = await supabase.from('product_variations').insert(rows);
      if (error) throw error;
    } catch (err) {
      console.error('Error saving variations:', err);
      throw err;
    }
  };

  // Get unique colors from variations
  const uniqueColors = [...new Set(variations.filter(v => v.color).map(v => v.color!))];
  const uniqueSizes = [...new Set(variations.filter(v => v.size).map(v => v.size!))];

  const getVariation = (color?: string, size?: string) => {
    return variations.find(v => 
      (color ? v.color === color : !v.color) && 
      (size ? v.size === size : !v.size)
    );
  };

  const getTotalStock = () => variations.reduce((sum, v) => sum + v.stock, 0);

  return {
    variations,
    loading,
    uniqueColors,
    uniqueSizes,
    getVariation,
    getTotalStock,
    saveVariations,
    refetch: fetchVariations,
  };
};
