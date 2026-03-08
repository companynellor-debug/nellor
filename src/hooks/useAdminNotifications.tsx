import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
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

const PAGE_SIZE = 20;

export const useAdminNotifications = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();
  const { user, profile, loading: authLoading } = useSupabaseAuth();

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

  const fetchNotifications = useCallback(async (pageNum = 0, append = false) => {
    if (authLoading) return;

    const isAdmin = profile?.tipo === 'admin';
    if (!user?.id || !isAdmin) {
      setNotifications([]);
      setUnreadCount(0);
      setHasMore(false);
      setLoading(false);
      return;
    }

    try {
      if (pageNum === 0) setLoading(true);

      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data: dbNotifications, error: dbError } = await supabase
        .from('notifications')
        .select('id, user_id, title, body, type, read, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (dbError) {
        console.error('Error fetching notifications:', dbError);
        setNotifications([]);
        setUnreadCount(0);
        setHasMore(false);
        return;
      }

      const mapped: AdminNotification[] = (dbNotifications || []).map((n) => ({
        id: n.id,
        type: n.type as AdminNotificationType,
        title: n.title,
        body: n.body,
        read: n.read ?? false,
        created_at: n.created_at || '',
        user_id: n.user_id,
      }));

      setHasMore(mapped.length === PAGE_SIZE);

      if (append) {
        setNotifications(prev => [...prev, ...mapped]);
      } else {
        setNotifications(mapped);
        setUnreadCount(mapped.filter(n => !n.read).length);
      }
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [authLoading, profile?.tipo, user?.id]);

  const loadMore = useCallback(() => {
    if (hasMore) fetchNotifications(page + 1, true);
  }, [hasMore, page, fetchNotifications]);

  useEffect(() => {
    setNotificationPermission(getNotificationPermission());
    fetchNotifications(0);

    const ordersChannel = supabase
      .channel('admin-orders-notify')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload) => {
          const order = payload.new as any;
          playNotificationSound();
          toast({ title: '🛒 Novo Pedido!', description: `Pedido #${order.order_number} - R$ ${Number(order.total)?.toFixed(2)}` });
          await showOrderNotification(order.order_number, Number(order.total), order.buyer_name);
          fetchNotifications(0);
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
            fetchNotifications(0);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(ordersChannel); };
  }, [playNotificationSound, toast, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    if (!notificationId.startsWith('sale-') && !notificationId.startsWith('cancelled-') && !notificationId.startsWith('commission-')) {
      await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
    }
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    const realIds = notifications.filter(n => !n.read && !n.id.startsWith('sale-') && !n.id.startsWith('cancelled-') && !n.id.startsWith('commission-')).map(n => n.id);
    if (realIds.length > 0) {
      await supabase.from('notifications').update({ read: true }).in('id', realIds);
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    toast({ title: 'Notificações marcadas como lidas' });
  };

  const getNotificationsByType = (type: AdminNotificationType) => notifications.filter(n => n.type === type);

  return { notifications, loading, unreadCount, hasMore, loadMore, notificationPermission, requestPermission, markAsRead, markAllAsRead, getNotificationsByType, refetch: () => fetchNotifications(0) };
};
