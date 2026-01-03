import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from './useSupabaseAuth';
import { toast } from 'sonner';

interface SupplierDropSettings {
  id: string;
  supplier_id: string;
  drop_enabled: boolean;
  default_commission_percent: number;
  allow_affiliates_on_drop: boolean;
  allow_service_providers_on_drop: boolean;
  min_order_value: number;
  created_at: string;
  updated_at: string;
}

interface ProductDropSetting {
  id: string;
  product_id: string;
  supplier_id: string;
  drop_enabled: boolean;
  commission_percent: number;
  allow_affiliates: boolean;
  allow_service_providers: boolean;
  shipping_days_estimate: number;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    nome: string;
    preco: number;
    imagens: string[] | null;
    estoque: number;
  };
}

interface SupplierDropStats {
  total_sales: number;
  total_orders: number;
  products_in_drop: number;
  pending_orders: number;
}

export function useSupplierDrop() {
  const { user } = useSupabaseAuth();
  const queryClient = useQueryClient();

  // Fetch supplier drop settings
  const { data: dropSettings, isLoading: loadingSettings } = useQuery({
    queryKey: ['supplier-drop-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('supplier_drop_settings')
        .select('*')
        .eq('supplier_id', user.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as SupplierDropSettings | null;
    },
    enabled: !!user?.id,
  });

  // Fetch supplier drop stats
  const { data: dropStats, isLoading: loadingStats } = useQuery({
    queryKey: ['supplier-drop-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .rpc('get_supplier_drop_stats', { _supplier_id: user.id });
      
      if (error) throw error;
      return (data?.[0] || { total_sales: 0, total_orders: 0, products_in_drop: 0, pending_orders: 0 }) as SupplierDropStats;
    },
    enabled: !!user?.id,
  });

  // Fetch products with drop settings
  const { data: productsWithDrop, isLoading: loadingProducts } = useQuery({
    queryKey: ['supplier-products-drop', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // First get all products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, nome, preco, imagens, estoque')
        .eq('supplier_id', user.id)
        .eq('ativo', true);
      
      if (productsError) throw productsError;
      
      // Then get drop settings
      const { data: dropSettingsData, error: dropError } = await supabase
        .from('product_drop_settings')
        .select('*')
        .eq('supplier_id', user.id);
      
      if (dropError) throw dropError;
      
      // Merge products with their drop settings
      return (products || []).map(product => {
        const dropSetting = dropSettingsData?.find(ds => ds.product_id === product.id);
        return {
          ...product,
          dropSetting: dropSetting || null,
        };
      });
    },
    enabled: !!user?.id,
  });

  // Fetch drop orders for supplier
  const { data: dropOrders, isLoading: loadingOrders } = useQuery({
    queryKey: ['supplier-drop-orders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('drop_orders')
        .select(`
          *,
          product:products(nome, imagens),
          client:client_drop_profiles(user_id, business_name)
        `)
        .eq('supplier_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Enable/disable drop mode for supplier
  const toggleDropMode = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      if (dropSettings) {
        const { error } = await supabase
          .from('supplier_drop_settings')
          .update({ drop_enabled: enabled })
          .eq('supplier_id', user.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('supplier_drop_settings')
          .insert({
            supplier_id: user.id,
            drop_enabled: enabled,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-drop-settings'] });
      toast.success('Configurações do Drop atualizadas!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar configurações: ' + error.message);
    },
  });

  // Update supplier drop settings
  const updateDropSettings = useMutation({
    mutationFn: async (settings: Partial<SupplierDropSettings>) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      if (dropSettings) {
        const { error } = await supabase
          .from('supplier_drop_settings')
          .update(settings)
          .eq('supplier_id', user.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('supplier_drop_settings')
          .insert({
            supplier_id: user.id,
            ...settings,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-drop-settings'] });
      toast.success('Configurações salvas!');
    },
    onError: (error) => {
      toast.error('Erro ao salvar: ' + error.message);
    },
  });

  // Toggle product drop availability
  const toggleProductDrop = useMutation({
    mutationFn: async ({ productId, enabled }: { productId: string; enabled: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const existing = await supabase
        .from('product_drop_settings')
        .select('id')
        .eq('product_id', productId)
        .maybeSingle();
      
      if (existing.data) {
        const { error } = await supabase
          .from('product_drop_settings')
          .update({ drop_enabled: enabled })
          .eq('product_id', productId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('product_drop_settings')
          .insert({
            product_id: productId,
            supplier_id: user.id,
            drop_enabled: enabled,
            commission_percent: dropSettings?.default_commission_percent || 10,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-products-drop'] });
      toast.success('Produto atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar produto: ' + error.message);
    },
  });

  // Update product drop settings
  const updateProductDropSettings = useMutation({
    mutationFn: async ({ productId, settings }: { productId: string; settings: Partial<ProductDropSetting> }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const existing = await supabase
        .from('product_drop_settings')
        .select('id')
        .eq('product_id', productId)
        .maybeSingle();
      
      if (existing.data) {
        const { error } = await supabase
          .from('product_drop_settings')
          .update(settings)
          .eq('product_id', productId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('product_drop_settings')
          .insert({
            product_id: productId,
            supplier_id: user.id,
            ...settings,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-products-drop'] });
      toast.success('Configurações do produto salvas!');
    },
    onError: (error) => {
      toast.error('Erro ao salvar: ' + error.message);
    },
  });

  // Update drop order status
  const updateDropOrderStatus = useMutation({
    mutationFn: async ({ orderId, status, trackingCode }: { orderId: string; status: string; trackingCode?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const updateData: Record<string, unknown> = { order_status: status };
      
      if (status === 'shipped' && trackingCode) {
        updateData.tracking_code = trackingCode;
        updateData.shipped_at = new Date().toISOString();
      }
      
      if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('drop_orders')
        .update(updateData)
        .eq('id', orderId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-drop-orders'] });
      toast.success('Status atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });

  return {
    dropSettings,
    dropStats,
    productsWithDrop,
    dropOrders,
    isLoading: loadingSettings || loadingStats || loadingProducts || loadingOrders,
    toggleDropMode,
    updateDropSettings,
    toggleProductDrop,
    updateProductDropSettings,
    updateDropOrderStatus,
  };
}
