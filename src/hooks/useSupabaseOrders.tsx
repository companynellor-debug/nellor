import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Order {
  id: string;
  order_number: string;
  buyer_id: string | null;
  supplier_id: string;
  itens: any;
  subtotal: number;
  frete: number;
  desconto: number;
  total: number;
  endereco_entrega: any;
  payment_method: 'pix' | 'boleto' | 'cartao';
  payment_status: 'pending' | 'paid' | 'refunded' | 'cancelled';
  order_status: 'pending' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
  status_label?: string | null;
  payment_status_label?: string | null;
  paid_at?: string | null;
  tracking_code: string | null;
  proof_url: string | null;
  shipping_company: string | null;
  estimated_delivery: string | null;
  stripe_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  stripe_payment_amount?: number | null;
  platform_fee?: number | null;
  supplier_amount?: number | null;
  created_at: string;
  updated_at: string;
}

export const useSupabaseOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Busca o perfil do usuário para saber o tipo
      const { data: profile } = await supabase
        .from('profiles')
        .select('tipo')
        .eq('id', user.id)
        .single();

      let query = supabase.from('orders').select('*');

      if (profile?.tipo === 'fornecedor') {
        // Fornecedor: vê TODOS os pedidos dele (incluindo pendentes para notificação)
        // Mostra todos para que o fornecedor veja pedidos aguardando pagamento
        query = query.eq('supplier_id', user.id);
      } else if (profile?.tipo === 'cliente') {
        // Cliente: vê todos os seus pedidos (incluindo pendentes)
        query = query.eq('buyer_id', user.id);
      } else {
        // Admin ou outros: vê tudo
        query = query.or(`buyer_id.eq.${user.id},supplier_id.eq.${user.id}`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Erro ao carregar pedidos',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const createOrder = async (orderData: Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at' | 'buyer_id'> & {
    stripe_session_id?: string;
    stripe_payment_amount?: number;
    platform_fee?: number;
    supplier_amount?: number;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Calculate platform fee if not provided (7.5%)
      const platformFee = orderData.platform_fee ?? orderData.total * 0.075;
      const supplierAmount = orderData.supplier_amount ?? orderData.total - platformFee;

      const { data, error } = await supabase
        .from('orders')
        .insert([{ 
          ...orderData, 
          buyer_id: user.id,
          order_number: `PED${Date.now()}`,
          platform_fee: platformFee,
          supplier_amount: supplierAmount,
          stripe_payment_amount: orderData.stripe_payment_amount ?? orderData.total,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Pedido criado!',
        description: `Pedido #${data.order_number} criado com sucesso`,
      });

      return data;
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        title: 'Erro ao criar pedido',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['order_status']) => {
    try {
      // Get order details before update for notification
      const order = orders.find(o => o.id === orderId);
      
      const { error } = await supabase
        .from('orders')
        .update({ order_status: status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      // Send push notification to buyer when status changes to shipped or delivered
      if (order?.buyer_id && (status === 'shipped' || status === 'delivered')) {
        try {
          const statusMessages = {
            shipped: {
              title: '📦 Pedido Enviado!',
              body: `Seu pedido #${order.order_number} foi enviado e está a caminho!`,
            },
            delivered: {
              title: '✅ Pedido Entregue!',
              body: `Seu pedido #${order.order_number} foi entregue com sucesso!`,
            },
          };
          
          await supabase.functions.invoke('send-push-notification', {
            body: {
              user_id: order.buyer_id,
              title: statusMessages[status].title,
              body: statusMessages[status].body,
              url: '/cliente/meus-pedidos',
              tag: `order-${status}-${order.order_number}`,
            },
          });
        } catch (pushError) {
          console.warn('Push notification failed:', pushError);
          // Don't fail the status update because of push notification error
        }
      }

      toast({
        title: 'Status atualizado',
        description: 'Status do pedido atualizado com sucesso',
      });
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updatePaymentProof = async (orderId: string, proofUrl: string) => {
    try {
      // OBS: pagamento só pode ser confirmado pelo webhook da Stripe.
      // Enviar comprovante NÃO altera payment_status.
      const { error } = await supabase
        .from('orders')
        .update({ proof_url: proofUrl })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Comprovante enviado',
        description: 'Comprovante de pagamento enviado com sucesso',
      });
    } catch (error: any) {
      console.error('Error updating payment proof:', error);
      toast({
        title: 'Erro ao enviar comprovante',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateTrackingCode = async (orderId: string, trackingCode: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ tracking_code: trackingCode })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Código de rastreio atualizado',
        description: 'Código de rastreio adicionado com sucesso',
      });
    } catch (error: any) {
      console.error('Error updating tracking code:', error);
      toast({
        title: 'Erro ao atualizar código',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const getOrderById = (orderId: string) => {
    return orders.find(order => order.id === orderId);
  };

  return {
    orders,
    loading,
    createOrder,
    updateOrderStatus,
    updatePaymentProof,
    updateTrackingCode,
    getOrderById,
    refetch: fetchOrders
  };
};
