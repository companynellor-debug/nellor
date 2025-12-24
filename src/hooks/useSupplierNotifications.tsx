import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { showPushNotification, requestNotificationPermission, getNotificationPermission } from '@/utils/pushNotifications';

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
  const processedOrdersRef = useRef<Set<string>>(new Set());
  const processedNotificationsRef = useRef<Set<string>>(new Set());

  const orderKey = (order: any, scope: 'created' | 'paid') => {
    const id = order?.id ?? 'unknown';
    const payment = order?.payment_status ?? 'unknown';
    return `${id}:${scope}:${payment}`;
  };

  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setPushPermission(getNotificationPermission());
    return granted;
  }, []);

  useEffect(() => {
    setPushPermission(getNotificationPermission());
  }, []);

  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.7;
      audio.play().catch(error => {
        console.log('🔇 Could not play notification sound:', error);
      });
    } catch (error) {
      console.log('🔇 Error creating audio:', error);
    }
  }, []);

  const showNewOrderNotification = useCallback(async (order: any) => {
    const key = orderKey(order, 'created');

    // Evita duplicadas (por status)
    if (processedOrdersRef.current.has(key)) {
      console.log('⏭️ Order already processed (created), skipping:', key);
      return;
    }
    processedOrdersRef.current.add(key);

    const orderNumber = order.order_number || 'N/A';
    const orderTotal = Number(order.total || 0).toFixed(2);
    const paymentStatus = order.payment_status || 'pending';

    console.log('🔔 Disparando notificação para NOVO pedido:', orderNumber, 'payment_status:', paymentStatus);

    playNotificationSound();

    const notifTitle = '🛒 Novo Pedido Gerado!';
    const notifBody = paymentStatus === 'paid'
      ? `Pedido #${orderNumber} já está pago. R$ ${orderTotal}`
      : `Pedido #${orderNumber} criado (aguardando pagamento). R$ ${orderTotal}`;

    try {
      await showPushNotification(notifTitle, {
        body: notifBody,
        tag: `new-order-${orderNumber}-${Date.now()}`,
        data: {
          type: 'new_order',
          orderId: order.id,
          orderNumber,
          url: '/fornecedor/pedidos',
        },
      });
      console.log('✅ Push notification sent for new order:', orderNumber);
    } catch (error) {
      console.error('❌ Error sending push notification (new order):', error);
    }

    toast({
      title: '🛒 Novo Pedido!',
      description: `Pedido #${orderNumber} - R$ ${orderTotal}`,
    });
  }, [playNotificationSound, toast]);

  const showPaidOrderNotification = useCallback(async (order: any) => {
    const key = orderKey(order, 'paid');

    // Evita notificações duplicadas
    if (processedOrdersRef.current.has(key)) {
      console.log('⏭️ Order already processed (paid), skipping:', key);
      return;
    }
    processedOrdersRef.current.add(key);

    const orderNumber = order.order_number || 'N/A';
    const orderTotal = Number(order.total || 0).toFixed(2);

    console.log('🔔 Disparando notificação para pedido PAGO:', orderNumber);

    // Som
    playNotificationSound();

    // Push notification nativa
    const notifTitle = '💰 Novo Pedido Recebido!';
    const notifBody = `Você recebeu um novo pedido #${orderNumber}\nR$ ${orderTotal}`;

    try {
      await showPushNotification(notifTitle, {
        body: notifBody,
        tag: `paid-order-${orderNumber}-${Date.now()}`,
        data: {
          type: 'paid_order',
          orderId: order.id,
          orderNumber: orderNumber,
          url: '/fornecedor/pedidos',
        },
      });
      console.log('✅ Push notification sent for order:', orderNumber);
    } catch (error) {
      console.error('❌ Error sending push notification:', error);
    }

    // Toast in-app
    toast({
      title: '💰 Novo Pedido PAGO!',
      description: `Pedido #${orderNumber} - R$ ${orderTotal} foi pago!`,
    });
  }, [playNotificationSound, toast]);

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
    let ordersChannel: ReturnType<typeof supabase.channel> | null = null;
    let notificationsChannel: ReturnType<typeof supabase.channel> | null = null;
    let isMounted = true;

    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      if (!userId) {
        console.log('❌ No user for realtime subscription');
        return;
      }

      console.log('🔌 Setting up realtime subscription for supplier:', userId);

      // Subscribe to ALL order changes (unfiltered for reliability)
      const ordersChannelName = `orders-supplier-${userId}`;
      ordersChannel = supabase
        .channel(ordersChannelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
          },
          async (payload) => {
            if (!isMounted) return;
            
            const newOrder = payload.new as any;
            const oldOrder = payload.old as any;
            
            // Filter for this supplier only
            if (newOrder?.supplier_id !== userId && oldOrder?.supplier_id !== userId) {
              return;
            }
            
            console.log('📦 Order event:', payload.eventType, 'Order:', newOrder?.order_number, 'Status:', newOrder?.payment_status);
            
            // INSERT: New order created for this supplier (any payment status)
            if (payload.eventType === 'INSERT') {
              await showNewOrderNotification(newOrder);

              // If it already comes paid, also show the paid notification
              if (newOrder?.payment_status === 'paid') {
                await showPaidOrderNotification(newOrder);
              }

              fetchNotifications();
              return;
            }
            
            // UPDATE: Order just got paid
            if (payload.eventType === 'UPDATE') {
              const wasPaid = oldOrder?.payment_status === 'paid';
              const isPaid = newOrder?.payment_status === 'paid';
              
              if (!wasPaid && isPaid) {
                console.log('✅ Order payment confirmed:', newOrder.order_number);
                await showPaidOrderNotification(newOrder);
                fetchNotifications();
              }
            }
          }
        )
        .subscribe((status, err) => {
          console.log('📡 Orders channel status:', status, err ? `Error: ${err}` : '');
          if (status === 'SUBSCRIBED') {
            console.log('✅ Realtime orders subscription ACTIVE for:', userId);
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Orders channel error:', err);
          }
        });

      // Subscribe to notifications table changes
      const notificationsChannelName = `notifications-supplier-${userId}`;
      notificationsChannel = supabase
        .channel(notificationsChannelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
          },
          async (payload) => {
            if (!isMounted) return;
            
            const newNotif = payload.new as SupplierNotification;
            
            // Filter for this user only
            if (newNotif.user_id !== userId) return;
            
            // Avoid duplicates
            if (processedNotificationsRef.current.has(newNotif.id)) {
              console.log('⏭️ Notification already processed:', newNotif.id);
              return;
            }
            processedNotificationsRef.current.add(newNotif.id);
            
            console.log('🔔 New notification received:', newNotif.title);
            
            if (newNotif.sound) {
              playNotificationSound();
            }
            
            // Push notification
            try {
              await showPushNotification(newNotif.title, {
                body: newNotif.body,
                tag: `notif-${newNotif.id}`,
                data: { url: '/fornecedor/notificacoes' },
              });
              console.log('✅ Push notification sent for notification:', newNotif.id);
            } catch (error) {
              console.error('❌ Error sending push notification:', error);
            }
            
            // Toast in-app
            toast({
              title: newNotif.title,
              description: newNotif.body,
            });
            
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        )
        .subscribe((status, err) => {
          console.log('📡 Notifications channel status:', status, err ? `Error: ${err}` : '');
          if (status === 'SUBSCRIBED') {
            console.log('✅ Realtime notifications subscription ACTIVE for:', userId);
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Notifications channel error:', err);
          }
        });
    };

    fetchNotifications();
    setupRealtimeSubscription();

    return () => {
      console.log('🔌 Cleaning up realtime subscriptions');
      isMounted = false;
      if (ordersChannel) {
        supabase.removeChannel(ordersChannel);
      }
      if (notificationsChannel) {
        supabase.removeChannel(notificationsChannel);
      }
    };
  }, [fetchNotifications, playNotificationSound, toast, showPaidOrderNotification, showNewOrderNotification]);

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