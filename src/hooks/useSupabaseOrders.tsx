import { useEffect, useRef, useState, useCallback } from 'react';
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

const PAGE_SIZE = 20;

function upsertOrder(list: Order[], next: Order): Order[] {
  const idx = list.findIndex((o) => o.id === next.id);
  if (idx === -1) return [next, ...list].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  const copy = list.slice();
  copy[idx] = { ...copy[idx], ...next };
  return copy.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export const useSupabaseOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  const roleRef = useRef<'fornecedor' | 'cliente' | 'admin' | 'unknown'>('unknown');
  const userIdRef = useRef<string | null>(null);

  const fetchOrders = useCallback(async (pageNum = 0, append = false) => {
    try {
      if (pageNum === 0) setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        userIdRef.current = null;
        roleRef.current = 'unknown';
        setOrders([]);
        return;
      }

      userIdRef.current = user.id;

      const { data: profile } = await supabase
        .from('profiles')
        .select('tipo')
        .eq('id', user.id)
        .single();

      roleRef.current = (profile?.tipo as any) || 'unknown';

      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('orders')
        .select('id, order_number, buyer_id, supplier_id, itens, subtotal, frete, desconto, total, endereco_entrega, payment_method, payment_status, order_status, tracking_code, proof_url, platform_fee, supplier_amount, created_at, updated_at');

      if (profile?.tipo === 'fornecedor') {
        query = query.eq('supplier_id', user.id);
      } else if (profile?.tipo === 'cliente') {
        query = query.eq('buyer_id', user.id);
      } else {
        query = query.or(`buyer_id.eq.${user.id},supplier_id.eq.${user.id}`);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const rows = (data || []) as Order[];
      setHasMore(rows.length === PAGE_SIZE);

      if (append) {
        setOrders(prev => [...prev, ...rows]);
      } else {
        setOrders(rows);
      }
      setPage(pageNum);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast({ title: 'Erro ao carregar pedidos', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadMore = useCallback(() => {
    if (hasMore) fetchOrders(page + 1, true);
  }, [hasMore, page, fetchOrders]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const start = async () => {
      await fetchOrders(0);

      const uid = userIdRef.current;
      const role = roleRef.current;
      if (!uid) return;

      const filter =
        role === 'fornecedor'
          ? `supplier_id=eq.${uid}`
          : role === 'cliente'
            ? `buyer_id=eq.${uid}`
            : undefined;

      channel = supabase
        .channel(`orders-changes-${uid}`)
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'orders',
          ...(filter ? { filter } : {}),
        }, (payload) => {
          if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((o) => o.id !== (payload.old as any).id));
            return;
          }
          setOrders((prev) => upsertOrder(prev, payload.new as any as Order));
        })
        .subscribe();
    };

    start();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [fetchOrders]);

  const createOrder = async (orderData: Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at' | 'buyer_id'> & {
    stripe_session_id?: string;
    stripe_payment_amount?: number;
    platform_fee?: number;
    supplier_amount?: number;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

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
      toast({ title: 'Pedido criado!', description: `Pedido #${data.order_number} criado com sucesso` });
      return data;
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({ title: 'Erro ao criar pedido', description: error.message, variant: 'destructive' });
      throw error;
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['order_status']) => {
    try {
      const order = orders.find(o => o.id === orderId);
      const { error } = await supabase
        .from('orders')
        .update({ order_status: status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      if (order?.buyer_id && (status === 'shipped' || status === 'delivered')) {
        try {
          const statusMessages = {
            shipped: { title: '📦 Pedido Enviado!', body: `Seu pedido #${order.order_number} foi enviado e está a caminho!` },
            delivered: { title: '✅ Pedido Entregue!', body: `Seu pedido #${order.order_number} foi entregue com sucesso!` },
          };
          await supabase.functions.invoke('send-push-notification', {
            body: { user_id: order.buyer_id, title: statusMessages[status].title, body: statusMessages[status].body, url: '/cliente/meus-pedidos', tag: `order-${status}-${order.order_number}` },
          });
        } catch (pushError) {
          console.warn('Push notification failed:', pushError);
        }
      }

      toast({ title: 'Status atualizado', description: 'Status do pedido atualizado com sucesso' });
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast({ title: 'Erro ao atualizar status', description: error.message, variant: 'destructive' });
      throw error;
    }
  };

  const updatePaymentProof = async (orderId: string, proofUrl: string) => {
    try {
      const { error } = await supabase.from('orders').update({ proof_url: proofUrl }).eq('id', orderId);
      if (error) throw error;
      toast({ title: 'Comprovante enviado', description: 'Comprovante de pagamento enviado com sucesso' });
    } catch (error: any) {
      console.error('Error updating payment proof:', error);
      toast({ title: 'Erro ao enviar comprovante', description: error.message, variant: 'destructive' });
      throw error;
    }
  };

  const updateTrackingCode = async (orderId: string, trackingCode: string) => {
    try {
      const { error } = await supabase.from('orders').update({ tracking_code: trackingCode }).eq('id', orderId);
      if (error) throw error;
      toast({ title: 'Código de rastreio atualizado', description: 'Código de rastreio adicionado com sucesso' });
    } catch (error: any) {
      console.error('Error updating tracking code:', error);
      toast({ title: 'Erro ao atualizar código', description: error.message, variant: 'destructive' });
      throw error;
    }
  };

  const confirmDelivery = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: 'delivered' as any, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      toast({ title: 'Recebimento confirmado!', description: 'Obrigado por confirmar a entrega do seu pedido.' });
    } catch (error: any) {
      console.error('Error confirming delivery:', error);
      toast({ title: 'Erro ao confirmar entrega', description: error.message, variant: 'destructive' });
      throw error;
    }
  };

  const getOrderById = (orderId: string) => orders.find(order => order.id === orderId);

  return { orders, loading, hasMore, loadMore, createOrder, updateOrderStatus, updatePaymentProof, updateTrackingCode, confirmDelivery, getOrderById, refetch: () => fetchOrders(0) };
};
