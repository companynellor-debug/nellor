import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ShippingRegion = 'norte' | 'nordeste' | 'centro_oeste' | 'sudeste' | 'sul';

export interface ShippingRegionConfig {
  id?: string;
  supplier_id?: string;
  region: ShippingRegion;
  price: number;
  free_above: number | null;
  allows_pickup: boolean;
  enabled: boolean; // frontend-only: true if row exists
}

const ALL_REGIONS: { key: ShippingRegion; label: string }[] = [
  { key: 'norte', label: 'Norte' },
  { key: 'nordeste', label: 'Nordeste' },
  { key: 'centro_oeste', label: 'Centro-Oeste' },
  { key: 'sudeste', label: 'Sudeste' },
  { key: 'sul', label: 'Sul' },
];

export const REGION_LABELS: Record<ShippingRegion, string> = {
  norte: 'Norte',
  nordeste: 'Nordeste',
  centro_oeste: 'Centro-Oeste',
  sudeste: 'Sudeste',
  sul: 'Sul',
};

// Map state abbreviations to regions
const STATE_TO_REGION: Record<string, ShippingRegion> = {
  AC: 'norte', AP: 'norte', AM: 'norte', PA: 'norte', RO: 'norte', RR: 'norte', TO: 'norte',
  AL: 'nordeste', BA: 'nordeste', CE: 'nordeste', MA: 'nordeste', PB: 'nordeste',
  PE: 'nordeste', PI: 'nordeste', RN: 'nordeste', SE: 'nordeste',
  DF: 'centro_oeste', GO: 'centro_oeste', MT: 'centro_oeste', MS: 'centro_oeste',
  ES: 'sudeste', MG: 'sudeste', RJ: 'sudeste', SP: 'sudeste',
  PR: 'sul', RS: 'sul', SC: 'sul',
};

export const getRegionFromState = (state: string): ShippingRegion | null => {
  return STATE_TO_REGION[state.toUpperCase()] || null;
};

const defaultConfigs = (): ShippingRegionConfig[] =>
  ALL_REGIONS.map(r => ({
    region: r.key,
    price: 0,
    free_above: null,
    allows_pickup: false,
    enabled: false,
  }));

export const useSupplierShipping = (supplierId?: string) => {
  const [configs, setConfigs] = useState<ShippingRegionConfig[]>(defaultConfigs());
  const [loading, setLoading] = useState(true);

  const fetchConfigs = useCallback(async () => {
    if (!supplierId) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('supplier_shipping_regions' as any)
        .select('*')
        .eq('supplier_id', supplierId);

      if (error) {
        // Table might not exist yet
        console.warn('Shipping regions table not available:', error.message);
        setLoading(false);
        return;
      }

      const merged = ALL_REGIONS.map(r => {
        const existing = (data as any[])?.find((d: any) => d.region === r.key);
        if (existing) {
          return {
            id: existing.id,
            supplier_id: existing.supplier_id,
            region: existing.region as ShippingRegion,
            price: Number(existing.price),
            free_above: existing.free_above ? Number(existing.free_above) : null,
            allows_pickup: existing.allows_pickup,
            enabled: true,
          };
        }
        return { region: r.key, price: 0, free_above: null, allows_pickup: false, enabled: false };
      });
      setConfigs(merged);
    } catch (err) {
      console.error('Error fetching shipping configs:', err);
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const updateConfig = (region: ShippingRegion, updates: Partial<ShippingRegionConfig>) => {
    setConfigs(prev => prev.map(c => c.region === region ? { ...c, ...updates } : c));
  };

  const saveConfigs = async () => {
    if (!supplierId) return;
    try {
      const enabledConfigs = configs.filter(c => c.enabled);
      const disabledRegions = configs.filter(c => !c.enabled).map(c => c.region);

      // Delete disabled regions
      if (disabledRegions.length > 0) {
        await supabase
          .from('supplier_shipping_regions' as any)
          .delete()
          .eq('supplier_id', supplierId)
          .in('region', disabledRegions);
      }

      // Upsert enabled regions
      for (const config of enabledConfigs) {
        const row = {
          supplier_id: supplierId,
          region: config.region,
          price: config.price,
          free_above: config.free_above,
          allows_pickup: config.allows_pickup,
        };

        if (config.id) {
          await (supabase.from('supplier_shipping_regions' as any) as any)
            .update(row)
            .eq('id', config.id);
        } else {
          await (supabase.from('supplier_shipping_regions' as any) as any)
            .insert(row);
        }
      }

      toast.success('Configurações de frete salvas!');
      fetchConfigs();
    } catch (err: any) {
      console.error('Error saving shipping configs:', err);
      toast.error('Erro ao salvar frete: ' + (err.message || ''));
    }
  };

  return { configs, loading, updateConfig, saveConfigs, allRegions: ALL_REGIONS };
};

// Public hook: get shipping for a specific supplier
export const useShippingCalculator = () => {
  const [loading, setLoading] = useState(false);

  const getShippingForSupplier = async (
    supplierId: string,
    state: string
  ): Promise<{
    available: boolean;
    price: number;
    freeAbove: number | null;
    allowsPickup: boolean;
    region: ShippingRegion | null;
  }> => {
    const region = getRegionFromState(state);
    if (!region) {
      return { available: false, price: 0, freeAbove: null, allowsPickup: false, region: null };
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('supplier_shipping_regions' as any)
        .select('*')
        .eq('supplier_id', supplierId)
        .eq('region', region)
        .maybeSingle();

      if (error || !data) {
        return { available: false, price: 0, freeAbove: null, allowsPickup: false, region };
      }

      return {
        available: true,
        price: Number((data as any).price),
        freeAbove: (data as any).free_above ? Number((data as any).free_above) : null,
        allowsPickup: (data as any).allows_pickup,
        region,
      };
    } catch {
      return { available: false, price: 0, freeAbove: null, allowsPickup: false, region };
    } finally {
      setLoading(false);
    }
  };

  return { getShippingForSupplier, loading };
};
