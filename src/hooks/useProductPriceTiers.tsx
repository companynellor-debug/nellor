import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PriceTier {
  id?: string;
  product_id?: string;
  min_quantity: number;
  max_quantity: number | null;
  price_per_unit: number;
}

export const useProductPriceTiers = (productId?: string) => {
  const [tiers, setTiers] = useState<PriceTier[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTiers = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_price_tiers')
        .select('*')
        .eq('product_id', productId)
        .order('min_quantity', { ascending: true });
      if (error) throw error;
      setTiers((data || []) as unknown as PriceTier[]);
    } catch (err) {
      console.error('Error fetching price tiers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTiers();
  }, [productId]);

  const saveTiers = async (prodId: string, newTiers: Omit<PriceTier, 'id' | 'product_id'>[]) => {
    try {
      await supabase.from('product_price_tiers').delete().eq('product_id', prodId);
      if (newTiers.length === 0) return;
      const rows = newTiers.map(t => ({
        product_id: prodId,
        min_quantity: t.min_quantity,
        max_quantity: t.max_quantity,
        price_per_unit: t.price_per_unit,
      }));
      const { error } = await supabase.from('product_price_tiers').insert(rows);
      if (error) throw error;
    } catch (err) {
      console.error('Error saving price tiers:', err);
      throw err;
    }
  };

  const getApplicableTier = (quantity: number): PriceTier | null => {
    // Find the tier where quantity falls within range, sorted by min_quantity desc to get best price
    const sorted = [...tiers].sort((a, b) => b.min_quantity - a.min_quantity);
    return sorted.find(t => quantity >= t.min_quantity && (t.max_quantity === null || quantity <= t.max_quantity)) || null;
  };

  const getUnitPrice = (quantity: number, fallbackPrice: number): number => {
    const tier = getApplicableTier(quantity);
    return tier ? tier.price_per_unit : fallbackPrice;
  };

  return { tiers, loading, saveTiers, getApplicableTier, getUnitPrice, refetch: fetchTiers };
};
