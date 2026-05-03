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
  delivery_days_min: number;
  delivery_days_max: number;
  active: boolean;
  enabled: boolean;
}

export interface ShippingConfig {
  id?: string;
  supplier_id?: string;
  origin_cep: string;
  origin_city: string;
  origin_state: string;
  use_melhor_envio: boolean;
  melhor_envio_token: string;
  free_shipping_above: number | null;
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
    delivery_days_min: 3,
    delivery_days_max: 10,
    active: true,
    enabled: false,
  }));

const defaultShippingConfig = (): ShippingConfig => ({
  origin_cep: '',
  origin_city: '',
  origin_state: '',
  use_melhor_envio: false,
  melhor_envio_token: '',
  free_shipping_above: null,
});

export const useSupplierShipping = (supplierId?: string) => {
  const [configs, setConfigs] = useState<ShippingRegionConfig[]>(defaultConfigs());
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig>(defaultShippingConfig());
  const [loading, setLoading] = useState(true);

  const fetchConfigs = useCallback(async () => {
    if (!supplierId) { setLoading(false); return; }
    try {
      // Fetch region configs
      const { data, error } = await supabase
        .from('supplier_shipping_regions' as any)
        .select('*')
        .eq('supplier_id', supplierId);

      if (error) {
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
            delivery_days_min: existing.delivery_days_min ?? 3,
            delivery_days_max: existing.delivery_days_max ?? 10,
            active: existing.active ?? true,
            enabled: true,
          };
        }
        return { region: r.key, price: 0, free_above: null, allows_pickup: false, delivery_days_min: 3, delivery_days_max: 10, active: true, enabled: false };
      });
      setConfigs(merged);

      // Fetch shipping config
      const { data: configData } = await supabase
        .from('supplier_shipping_config' as any)
        .select('*')
        .eq('supplier_id', supplierId)
        .maybeSingle();

      if (configData) {
        const c = configData as any;
        setShippingConfig({
          id: c.id,
          supplier_id: c.supplier_id,
          origin_cep: c.origin_cep || '',
          origin_city: c.origin_city || '',
          origin_state: c.origin_state || '',
          use_melhor_envio: c.use_melhor_envio || false,
          melhor_envio_token: c.melhor_envio_token || '',
          free_shipping_above: c.free_shipping_above ? Number(c.free_shipping_above) : null,
        });
      }
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

  const updateShippingConfig = (updates: Partial<ShippingConfig>) => {
    setShippingConfig(prev => ({ ...prev, ...updates }));
  };

  const saveConfigs = async () => {
    if (!supplierId) return;
    try {
      // Save shipping config (upsert)
      const configRow = {
        supplier_id: supplierId,
        origin_cep: shippingConfig.origin_cep,
        origin_city: shippingConfig.origin_city,
        origin_state: shippingConfig.origin_state,
        use_melhor_envio: shippingConfig.use_melhor_envio,
        melhor_envio_token: shippingConfig.melhor_envio_token || null,
        free_shipping_above: shippingConfig.free_shipping_above,
      };

      if (shippingConfig.id) {
        await (supabase.from('supplier_shipping_config' as any) as any)
          .update(configRow)
          .eq('id', shippingConfig.id);
      } else {
        await (supabase.from('supplier_shipping_config' as any) as any)
          .insert(configRow);
      }

      // Save region configs
      const enabledConfigs = configs.filter(c => c.enabled);
      const disabledRegions = configs.filter(c => !c.enabled).map(c => c.region);

      if (disabledRegions.length > 0) {
        await supabase
          .from('supplier_shipping_regions' as any)
          .delete()
          .eq('supplier_id', supplierId)
          .in('region', disabledRegions);
      }

      for (const config of enabledConfigs) {
        const row = {
          supplier_id: supplierId,
          region: config.region,
          price: config.price,
          free_above: config.free_above,
          allows_pickup: config.allows_pickup,
          delivery_days_min: config.delivery_days_min,
          delivery_days_max: config.delivery_days_max,
          active: config.active,
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

  return { configs, shippingConfig, loading, updateConfig, updateShippingConfig, saveConfigs, allRegions: ALL_REGIONS };
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
    deliveryDaysMin: number | null;
    deliveryDaysMax: number | null;
  }> => {
    const region = getRegionFromState(state);
    if (!region) {
      return { available: false, price: 0, freeAbove: null, allowsPickup: false, region: null, deliveryDaysMin: null, deliveryDaysMax: null };
    }

    setLoading(true);
    try {
      // Check supplier config for global free_shipping_above
      const { data: configData } = await supabase
        .from('supplier_shipping_config' as any)
        .select('free_shipping_above')
        .eq('supplier_id', supplierId)
        .maybeSingle();

      const { data, error } = await supabase
        .from('supplier_shipping_regions' as any)
        .select('*')
        .eq('supplier_id', supplierId)
        .eq('region', region)
        .maybeSingle();

      if (error || !data) {
        return { available: false, price: 0, freeAbove: null, allowsPickup: false, region, deliveryDaysMin: null, deliveryDaysMax: null };
      }

      const d = data as any;
      const globalFreeAbove = configData ? Number((configData as any).free_shipping_above) : null;
      const regionFreeAbove = d.free_above ? Number(d.free_above) : null;
      // Use whichever free_above is set (prefer global config)
      const freeAbove = globalFreeAbove || regionFreeAbove;

      return {
        available: true,
        price: Number(d.price),
        freeAbove,
        allowsPickup: d.allows_pickup,
        region,
        deliveryDaysMin: d.delivery_days_min ?? null,
        deliveryDaysMax: d.delivery_days_max ?? null,
      };
    } catch {
      return { available: false, price: 0, freeAbove: null, allowsPickup: false, region, deliveryDaysMin: null, deliveryDaysMax: null };
    } finally {
      setLoading(false);
    }
  };

  return { getShippingForSupplier, loading };
};
