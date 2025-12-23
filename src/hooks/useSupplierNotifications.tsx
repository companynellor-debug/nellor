import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { showOrderNotification, requestNotificationPermission, getNotificationPermission, showPaymentNotification } from '@/utils/pushNotifications';

export interface SupplierNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  data: any;
  type: 'order_update' | 'message' | 'alert' | 'payout' | 'admin';
  sound: boolean;
  read: boolean;
  created_at: string;
}

export const useSupplierNotifications = () => {
  const [notifications, setNotifications] = useState<SupplierNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const { toast } = useToast();

  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setPushPermission(getNotificationPermission());
    return granted;
  }, []);

  useEffect(() => {
    setPushPermission(getNotificationPermission());
  }, []);

  const playNotificationSound = useCallback(() => {
    const audio = new Audio('/notification-sound.mp3');
    audio.volume = 0.5;
    audio.play().catch(error => {
      console.error('Error playing notification sound:', error);
    });
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const notifs = data || [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let userId: string | null = null;

    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
      
      if (!userId) return;

      // Subscribe to new orders for this supplier
      const ordersChannel = supabase
        .channel('supplier-orders-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `supplier_id=eq.${userId}`
          },
          async (payload) => {
            const newOrder = payload.new as any;
            
            // Play sound
            playNotificationSound();
            
            // Show push notification
            await showOrderNotification(
              newOrder.order_number,
              newOrder.total,
              undefined
            );
            
            // Show in-app toast
            toast({
              title: '🛒 Novo Pedido Recebido!',
              description: `Pedido #${newOrder.order_number} - R$ ${newOrder.total?.toFixed(2)}`,
            });

            // Refetch notifications
            fetchNotifications();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `supplier_id=eq.${userId}`
          },
          async (payload) => {
            const updatedOrder = payload.new as any;
            const oldOrder = payload.old as any;
            
            // Check if payment status changed to paid
            if (oldOrder.payment_status !== 'paid' && updatedOrder.payment_status === 'paid') {
              playNotificationSound();
              
              await showPaymentNotification(
                updatedOrder.order_number,
                updatedOrder.total,
                'paid'
              );
              
              toast({
                title: '✅ Pagamento Confirmado!',
                description: `Pedido #${updatedOrder.order_number} foi pago`,
              });
            }
          }
        )
        .subscribe();

      // Subscribe to notifications table changes
      const notificationsChannel = supabase
        .channel('supplier-notifications-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const newNotif = payload.new as SupplierNotification;
            
            if (newNotif.sound) {
              playNotificationSound();
            }
            
            toast({
              title: newNotif.title,
              description: newNotif.body,
            });
            
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(ordersChannel);
        supabase.removeChannel(notificationsChannel);
      };
    };

    fetchNotifications();
    const cleanup = setupRealtimeSubscription();

    return () => {
      cleanup.then(fn => fn?.());
    };
  }, [fetchNotifications, playNotificationSound, toast]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;
      
      toast({
        title: 'Notificações marcadas como lidas',
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error: any) {
      console.error('Error marking all as read:', error);
    }
  };

  return {
    notifications,
    loading,
    unreadCount,
    pushPermission,
    requestPermission,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  };
};
