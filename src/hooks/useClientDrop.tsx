import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from './useSupabaseAuth';
import { toast } from 'sonner';

interface ClientDropProfile {
  id: string;
  user_id: string;
  drop_enabled: boolean;
  business_name: string | null;
  created_at: string;
  updated_at: string;
}

interface ClientDropProduct {
  id: string;
  client_id: string;
  product_id: string;
  product_drop_setting_id: string;
  custom_price: number;
  margin_type: 'fixed' | 'percentage';
  margin_value: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    nome: string;
    preco: number;
    imagens: string[] | null;
    estoque: number;
    supplier_id: string;
  };
  supplier?: {
    nome: string;
    foto_perfil_url: string | null;
  };
}

interface DropCatalogItem {
  product_id: string;
  product_name: string;
  product_images: string[] | null;
  product_description: string | null;
  base_price: number;
  commission_percent: number;
  shipping_days: number;
  supplier_id: string;
  supplier_name: string;
  supplier_avatar: string | null;
  stock: number;
  allow_affiliates: boolean;
  allow_service_providers: boolean;
}

interface ClientDropStats {
  total_sales: number;
  total_profit: number;
  active_products: number;
  pending_orders: number;
  avg_commission: number;
}

export function useClientDrop() {
  const { user } = useSupabaseAuth();
  const queryClient = useQueryClient();

  // Fetch client drop profile
  const { data: dropProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ['client-drop-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('client_drop_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as ClientDropProfile | null;
    },
    enabled: !!user?.id,
  });

  // Fetch client drop stats
  const { data: dropStats, isLoading: loadingStats } = useQuery({
    queryKey: ['client-drop-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .rpc('get_client_drop_stats', { _client_id: user.id });
      
      if (error) throw error;
      return (data?.[0] || { 
        total_sales: 0, 
        total_profit: 0, 
        active_products: 0, 
        pending_orders: 0, 
        avg_commission: 0 
      }) as ClientDropStats;
    },
    enabled: !!user?.id && !!dropProfile?.drop_enabled,
  });

  // Fetch drop catalog
  const { data: dropCatalog, isLoading: loadingCatalog } = useQuery({
    queryKey: ['drop-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_drop_catalog');
      
      if (error) throw error;
      return (data || []) as DropCatalogItem[];
    },
    enabled: !!dropProfile?.drop_enabled,
  });

  // Fetch client's drop products
  const { data: myDropProducts, isLoading: loadingMyProducts } = useQuery({
    queryKey: ['client-drop-products', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('client_drop_products')
        .select(`
          *,
          product:products(id, nome, preco, imagens, estoque, supplier_id),
          product_drop_setting:product_drop_settings(commission_percent, shipping_days_estimate)
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get supplier info for each product
      const supplierIds = [...new Set((data || []).map(p => p.product?.supplier_id).filter(Boolean))];
      
      if (supplierIds.length > 0) {
        const { data: suppliers } = await supabase
          .from('profiles')
          .select('id, nome, foto_perfil_url')
          .in('id', supplierIds);
        
        return (data || []).map(product => ({
          ...product,
          supplier: suppliers?.find(s => s.id === product.product?.supplier_id) || null,
        }));
      }
      
      return data || [];
    },
    enabled: !!user?.id && !!dropProfile?.drop_enabled,
  });

  // Fetch client's drop orders
  const { data: dropOrders, isLoading: loadingOrders } = useQuery({
    queryKey: ['client-drop-orders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('drop_orders')
        .select(`
          *,
          product:products(nome, imagens)
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!dropProfile?.drop_enabled,
  });

  // Activate drop mode
  const activateDropMode = useMutation({
    mutationFn: async (businessName?: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      if (dropProfile) {
        const { error } = await supabase
          .from('client_drop_profiles')
          .update({ 
            drop_enabled: true,
            business_name: businessName || dropProfile.business_name,
          })
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('client_drop_profiles')
          .insert({
            user_id: user.id,
            drop_enabled: true,
            business_name: businessName || null,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-drop-profile'] });
      toast.success('Nellor Drop ativado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao ativar: ' + error.message);
    },
  });

  // Deactivate drop mode
  const deactivateDropMode = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('client_drop_profiles')
        .update({ drop_enabled: false })
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-drop-profile'] });
      toast.success('Nellor Drop desativado.');
    },
    onError: (error) => {
      toast.error('Erro: ' + error.message);
    },
  });

  // Add product to drop
  const addProductToDrop = useMutation({
    mutationFn: async ({ 
      productId, 
      customPrice, 
      marginType, 
      marginValue 
    }: { 
      productId: string; 
      customPrice: number; 
      marginType: 'fixed' | 'percentage'; 
      marginValue: number;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Get product drop setting id
      const { data: dropSetting, error: settingError } = await supabase
        .from('product_drop_settings')
        .select('id')
        .eq('product_id', productId)
        .eq('drop_enabled', true)
        .single();
      
      if (settingError || !dropSetting) throw new Error('Produto não disponível para Drop');
      
      const { error } = await supabase
        .from('client_drop_products')
        .insert({
          client_id: user.id,
          product_id: productId,
          product_drop_setting_id: dropSetting.id,
          custom_price: customPrice,
          margin_type: marginType,
          margin_value: marginValue,
          is_active: true,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-drop-products'] });
      toast.success('Produto adicionado ao seu Drop!');
    },
    onError: (error) => {
      toast.error('Erro: ' + error.message);
    },
  });

  // Update my drop product
  const updateMyDropProduct = useMutation({
    mutationFn: async ({ 
      id, 
      customPrice, 
      marginType, 
      marginValue, 
      isActive 
    }: { 
      id: string; 
      customPrice?: number; 
      marginType?: 'fixed' | 'percentage'; 
      marginValue?: number;
      isActive?: boolean;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const updateData: Record<string, unknown> = {};
      if (customPrice !== undefined) updateData.custom_price = customPrice;
      if (marginType !== undefined) updateData.margin_type = marginType;
      if (marginValue !== undefined) updateData.margin_value = marginValue;
      if (isActive !== undefined) updateData.is_active = isActive;
      
      const { error } = await supabase
        .from('client_drop_products')
        .update(updateData)
        .eq('id', id)
        .eq('client_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-drop-products'] });
      toast.success('Produto atualizado!');
    },
    onError: (error) => {
      toast.error('Erro: ' + error.message);
    },
  });

  // Remove product from drop
  const removeFromDrop = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('client_drop_products')
        .delete()
        .eq('id', id)
        .eq('client_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-drop-products'] });
      toast.success('Produto removido do Drop.');
    },
    onError: (error) => {
      toast.error('Erro: ' + error.message);
    },
  });

  // Create drop order (manual)
  const createDropOrder = useMutation({
    mutationFn: async ({
      clientDropProductId,
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerDocument,
      shippingAddress,
      quantity,
      externalMarketplace,
      externalOrderId,
    }: {
      clientDropProductId: string;
      buyerName: string;
      buyerEmail?: string;
      buyerPhone?: string;
      buyerDocument?: string;
      shippingAddress: Record<string, unknown>;
      quantity: number;
      externalMarketplace?: string;
      externalOrderId?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Get client drop product with pricing info
      const { data: dropProduct, error: productError } = await supabase
        .from('client_drop_products')
        .select(`
          *,
          product:products(id, preco, supplier_id),
          product_drop_setting:product_drop_settings(commission_percent)
        `)
        .eq('id', clientDropProductId)
        .eq('client_id', user.id)
        .single();
      
      if (productError || !dropProduct) throw new Error('Produto não encontrado');
      
      const basePrice = dropProduct.product?.preco || 0;
      const salePrice = dropProduct.custom_price;
      const clientMargin = (salePrice - basePrice) * quantity;
      const supplierAmount = basePrice * quantity;
      const total = salePrice * quantity;
      
      // Use raw query since types haven't been regenerated yet
      const { error } = await (supabase as unknown as { from: (table: string) => { insert: (data: Record<string, unknown>) => Promise<{ error: Error | null }> } })
        .from('drop_orders')
        .insert({
          client_id: user.id,
          supplier_id: dropProduct.product?.supplier_id,
          client_drop_product_id: clientDropProductId,
          product_id: dropProduct.product_id,
          buyer_name: buyerName,
          buyer_email: buyerEmail || null,
          buyer_phone: buyerPhone || null,
          buyer_document: buyerDocument || null,
          shipping_address: shippingAddress,
          quantity,
          base_price: basePrice,
          sale_price: salePrice,
          client_margin: clientMargin,
          platform_fee: 0,
          supplier_amount: supplierAmount,
          total,
          external_marketplace: externalMarketplace || null,
          external_order_id: externalOrderId || null,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-drop-orders'] });
      toast.success('Pedido Drop criado!');
    },
    onError: (error) => {
      toast.error('Erro ao criar pedido: ' + error.message);
    },
  });

  return {
    dropProfile,
    dropStats,
    dropCatalog,
    myDropProducts,
    dropOrders,
    isDropEnabled: dropProfile?.drop_enabled ?? false,
    isLoading: loadingProfile || loadingStats || loadingCatalog || loadingMyProducts || loadingOrders,
    activateDropMode,
    deactivateDropMode,
    addProductToDrop,
    updateMyDropProduct,
    removeFromDrop,
    createDropOrder,
  };
}
