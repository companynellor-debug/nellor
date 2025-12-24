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
        console.error('Error playing notification sound:', error);
      });
    } catch (error) {
      console.error('Error creating audio:', error);
    }
  }, []);

  const showPaidOrderNotification = useCallback(async (order: any) => {
    const orderId = order.id;
    
    // Evita notificações duplicadas
    if (processedOrdersRef.current.has(orderId)) {
      console.log('Order already processed:', orderId);
      return;
    }
    processedOrdersRef.current.add(orderId);

    const orderNumber = order.order_number || 'N/A';
    const orderTotal = Number(order.total || 0).toFixed(2);

    console.log('🔔 Disparando notificação para pedido PAGO:', orderNumber);

    // Som
    playNotificationSound();

    // Push notification nativa - título e corpo bem formatados
    const notifTitle = '💰 Novo Pedido Recebido!';
    const notifBody = `Você recebeu um novo pedido #${orderNumber}\nR$ ${orderTotal}`;

    await showPushNotification(notifTitle, {
      body: notifBody,
      tag: `paid-order-${orderNumber}-${Date.now()}`, // Tag única para não agrupar
      data: {
        type: 'paid_order',
        orderId: order.id,
        orderNumber: orderNumber,
        url: '/fornecedor/pedidos',
      },
    });

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
    let ordersChannel: any = null;
    let notificationsChannel: any = null;
    let isMounted = true;

    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      if (!userId) {
        console.log('❌ No user for realtime subscription');
        return;
      }

      console.log('🔌 Setting up realtime subscription for supplier:', userId);

      // Subscribe to ALL order changes for this supplier (sem filtro para maior confiabilidade)
      ordersChannel = supabase
        .channel(`supplier-orders-realtime-${userId}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*', // Escuta todos os eventos
            schema: 'public',
            table: 'orders',
          },
          async (payload) => {
            if (!isMounted) return;
            
            const newOrder = payload.new as any;
            const oldOrder = payload.old as any;
            
            // Filtra apenas pedidos deste fornecedor
            if (newOrder?.supplier_id !== userId && oldOrder?.supplier_id !== userId) {
              return;
            }
            
            console.log('📦 Order event received:', payload.eventType, newOrder?.order_number);
            
            // INSERT: Novo pedido que já veio pago
            if (payload.eventType === 'INSERT' && newOrder?.payment_status === 'paid') {
              console.log('✅ New order already paid:', newOrder.order_number);
              await showPaidOrderNotification(newOrder);
              fetchNotifications();
              return;
            }
            
            // UPDATE: Pedido foi pago agora
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
        .subscribe((status) => {
          console.log('📡 Orders channel status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Realtime orders subscription active for:', userId);
          }
        });

      // Subscribe to notifications table changes
      notificationsChannel = supabase
        .channel(`supplier-notifications-realtime-${userId}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
          },
          (payload) => {
            if (!isMounted) return;
            
            const newNotif = payload.new as SupplierNotification;
            
            // Filtra apenas notificações deste usuário
            if (newNotif.user_id !== userId) return;
            
            console.log('🔔 Notification INSERT received:', payload);
            
            if (newNotif.sound) {
              playNotificationSound();
            }
            
            // Push notification para notificações da tabela
            showPushNotification(newNotif.title, {
              body: newNotif.body,
              tag: `notif-${newNotif.id}`,
              data: { url: '/fornecedor/notificacoes' },
            });
            
            toast({
              title: newNotif.title,
              description: newNotif.body,
            });
            
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        )
        .subscribe((status) => {
          console.log('📡 Notifications channel status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Realtime notifications subscription active for:', userId);
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
  }, [fetchNotifications, playNotificationSound, toast, showPaidOrderNotification]);

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
