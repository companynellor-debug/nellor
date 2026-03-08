import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  showOrderNotification, 
  showPaymentNotification,
  requestNotificationPermission,
  getNotificationPermission
} from '@/utils/pushNotifications';

export type AdminNotificationType = 'sale' | 'commission' | 'alert' | 'supplier' | 'payment' | 'order_update' | 'order_status_changed' | 'payment_confirmed' | 'new_message' | 'promotion' | 'general';

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
  user_id?: string;
}

let notificationsCache: AdminNotification[] | null = null;
let lastFetch = 0;
const CACHE_TTL = 3 * 60 * 1000;

export const useAdminNotifications = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>(notificationsCache || []);
  const [loading, setLoading] = useState(!notificationsCache);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const { toast } = useToast();

  const playNotificationSound = useCallback(() => {
    const audio = new Audio('/notification-sound.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {});
  }, []);

  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(getNotificationPermission());
    return granted;
  }, []);

  const fetchNotifications = useCallback(async (force = false) => {
    if (!force && notificationsCache && Date.now() - lastFetch < CACHE_TTL) {
      setNotifications(notificationsCache);
      setUnreadCount(notificationsCache.filter(n => !n.read).length);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch REAL notifications from DB (admin RLS = ALL)
      const { data: dbNotifications, error: dbError } = await supabase
        .from('notifications')
        .select('id, user_id, title, body, type, read, created_at, data')
        .order('created_at', { ascending: false })
        .limit(100);

      if (dbError) {
        console.error('Error fetching notifications:', dbError);
      }

      // Also fetch recent orders for sale/commission cards
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number, total, payment_status, order_status, created_at, updated_at, platform_fee')
        .order('created_at', { ascending: false })
        .limit(20);

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
      }

      const allNotifications: AdminNotification[] = [];

      // Map DB notifications
      if (dbNotifications) {
        dbNotifications.forEach((n) => {
          allNotifications.push({
            id: n.id,
            type: n.type as AdminNotificationType,
            title: n.title,
            body: n.body,
            read: n.read ?? false,
            created_at: n.created_at || '',
            user_id: n.user_id,
          });
        });
      }

      // Map orders into sale/commission notifications (only if not already in DB notifications)
      const dbTitles = new Set(dbNotifications?.map(n => n.title) || []);
      if (ordersData) {
        ordersData.forEach((order) => {
          if (order.payment_status === 'paid' && order.order_status !== 'cancelled') {
            const saleTitle = `Venda Aprovada`;
            if (!dbTitles.has(saleTitle)) {
              const commission = (order.platform_fee as number) || order.total * 0.075;
              allNotifications.push({
                id: `sale-${order.id}`,
                type: 'sale',
                title: saleTitle,
                body: `Pedido #${order.order_number}`,
                value: order.total,
                commission,
                reference_id: order.id,
                reference_type: 'order',
                read: true,
                created_at: order.created_at || '',
                order_number: order.order_number,
              });
            }
          }

          if (order.payment_status === 'cancelled' || order.order_status === 'cancelled') {
            const cancelTitle = `Pedido Cancelado`;
            if (!dbTitles.has(cancelTitle)) {
              allNotifications.push({
                id: `cancelled-${order.id}`,
                type: 'alert',
                title: cancelTitle,
                body: `Pedido #${order.order_number} foi cancelado`,
                value: order.total,
                reference_id: order.id,
                reference_type: 'order',
                read: true,
                created_at: order.updated_at || order.created_at || '',
                order_number: order.order_number,
              });
            }
          }
        });
      }

      // Sort by date
      allNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      notificationsCache = allNotifications;
      lastFetch = Date.now();

      setNotifications(allNotifications);
      setUnreadCount(allNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setNotificationPermission(getNotificationPermission());
    fetchNotifications();

    const ordersChannel = supabase
      .channel('admin-orders-notify')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload) => {
          const order = payload.new as any;
          playNotificationSound();
          toast({ title: '🛒 Novo Pedido!', description: `Pedido #${order.order_number} - R$ ${Number(order.total)?.toFixed(2)}` });
          await showOrderNotification(order.order_number, Number(order.total), order.buyer_name);
          notificationsCache = null;
          fetchNotifications(true);
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' },
        async (payload) => {
          const order = payload.new as any;
          const oldOrder = payload.old as any;
          if (order?.payment_status === 'paid' && oldOrder?.payment_status !== 'paid') {
            const commission = Number(order.platform_fee) || Number(order.total) * 0.075;
            playNotificationSound();
            toast({ title: '✅ Pagamento Confirmado!', description: `Pedido #${order.order_number} - R$ ${Number(order.total)?.toFixed(2)}` });
            setTimeout(() => {
              toast({ title: '💰 Comissão Recebida!', description: `R$ ${commission.toFixed(2).replace('.', ',')} (7,5%)` });
            }, 1500);
            await showPaymentNotification(order.order_number, Number(order.total), 'paid');
            notificationsCache = null;
            fetchNotifications(true);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(ordersChannel); };
  }, [playNotificationSound, toast, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    // If it's a real DB notification (UUID format), update in DB
    if (!notificationId.startsWith('sale-') && !notificationId.startsWith('cancelled-') && !notificationId.startsWith('commission-')) {
      await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
    }
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    // Mark all real DB notifications as read
    const realIds = notifications.filter(n => !n.read && !n.id.startsWith('sale-') && !n.id.startsWith('cancelled-') && !n.id.startsWith('commission-')).map(n => n.id);
    if (realIds.length > 0) {
      await supabase.from('notifications').update({ read: true }).in('id', realIds);
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    toast({ title: 'Notificações marcadas como lidas' });
  };

  const getNotificationsByType = (type: AdminNotificationType) => {
    return notifications.filter(n => n.type === type);
  };

  return {
    notifications,
    loading,
    unreadCount,
    notificationPermission,
    requestPermission,
    markAsRead,
    markAllAsRead,
    getNotificationsByType,
    refetch: () => fetchNotifications(true)
  };
};
