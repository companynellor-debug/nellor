import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type AdminNotificationType = 'sale' | 'commission' | 'alert' | 'supplier' | 'payment';

export interface AdminNotification {
  id: string;
  type: AdminNotificationType;
  title: string;
  body: string;
  value?: number;
  commission?: number;
  reference_id?: string;
  reference_type?: 'order' | 'supplier' | 'payout';
  read: boolean;
  created_at: string;
  supplier_name?: string;
  buyer_name?: string;
  order_number?: string;
}

export const useAdminNotifications = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  const playNotificationSound = () => {
    const audio = new Audio('/notification-sound.mp3');
    audio.volume = 0.5;
    audio.play().catch(error => {
      console.error('Error playing notification sound:', error);
    });
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Fetch all paid orders as sale/commission notifications
      const { data: ordersData, error: ordersError } = await supabase
        .rpc('get_admin_orders');

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
      }

      const allNotifications: AdminNotification[] = [];

      // Transform paid orders into sale and commission notifications
      if (ordersData) {
        ordersData.forEach((order: any) => {
          if (order.payment_status === 'paid' && order.order_status !== 'cancelled') {
            const commission = order.total * 0.075;
            
            // Sale notification
            allNotifications.push({
              id: `sale-${order.id}`,
              type: 'sale',
              title: 'Venda Aprovada',
              body: `Pedido #${order.order_number} - ${order.buyer_name || 'Cliente'}`,
              value: order.total,
              commission: commission,
              reference_id: order.id,
              reference_type: 'order',
              read: true, // Historical data is considered read
              created_at: order.created_at,
              supplier_name: order.supplier_name,
              buyer_name: order.buyer_name,
              order_number: order.order_number
            });

            // Commission notification
            allNotifications.push({
              id: `commission-${order.id}`,
              type: 'commission',
              title: 'Comissão Nellor',
              body: `7,5% do pedido #${order.order_number}`,
              value: commission,
              reference_id: order.id,
              reference_type: 'order',
              read: true,
              created_at: order.created_at,
              supplier_name: order.supplier_name,
              order_number: order.order_number
            });
          }

          // Failed/cancelled payment notifications
          if (order.payment_status === 'cancelled' || order.order_status === 'cancelled') {
            allNotifications.push({
              id: `cancelled-${order.id}`,
              type: 'alert',
              title: 'Pedido Cancelado',
              body: `Pedido #${order.order_number} foi cancelado`,
              value: order.total,
              reference_id: order.id,
              reference_type: 'order',
              read: true,
              created_at: order.updated_at || order.created_at,
              supplier_name: order.supplier_name,
              order_number: order.order_number
            });
          }
        });
      }

      // Fetch supplier registrations from profiles
      const { data: suppliersData } = await supabase
        .rpc('get_admin_profiles');

      if (suppliersData) {
        suppliersData.forEach((profile: any) => {
          if (profile.tipo === 'fornecedor') {
            allNotifications.push({
              id: `supplier-${profile.id}`,
              type: 'supplier',
              title: profile.stripe_account_id ? 'Stripe Conectado' : 'Novo Fornecedor',
              body: profile.stripe_account_id 
                ? `${profile.nome} conectou sua conta Stripe`
                : `${profile.nome} se cadastrou na plataforma`,
              reference_id: profile.id,
              reference_type: 'supplier',
              read: true,
              created_at: profile.created_at,
              supplier_name: profile.nome
            });
          }
        });
      }

      // Sort all notifications by date (newest first)
      allNotifications.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(allNotifications);
      setUnreadCount(allNotifications.filter(n => !n.read).length);
    } catch (error: any) {
      console.error('Error fetching admin notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Subscribe to realtime changes for new orders
    const channel = supabase
      .channel('admin-notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          const order = payload.new as any;
          
          if (order?.payment_status === 'paid') {
            playNotificationSound();
            toast({
              title: 'Nova Venda!',
              description: `Pedido #${order.order_number} - R$ ${order.total?.toFixed(2)}`,
            });
            fetchNotifications();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = async (notificationId: string) => {
    // For historical data, just update local state
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    
    toast({
      title: 'Notificações marcadas como lidas',
    });
  };

  const getNotificationsByType = (type: AdminNotificationType) => {
    return notifications.filter(n => n.type === type);
  };

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    getNotificationsByType,
    refetch: fetchNotifications
  };
};
