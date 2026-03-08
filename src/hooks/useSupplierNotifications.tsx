import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { requestNotificationPermission, getNotificationPermission } from '@/utils/pushNotifications';

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

const PAGE_SIZE = 20;

export const useSupplierNotifications = () => {
  const [notifications, setNotifications] = useState<SupplierNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setPushPermission(getNotificationPermission());
    return granted;
  }, []);

  useEffect(() => { setPushPermission(getNotificationPermission()); }, []);

  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.7;
      audio.play().catch(() => {});
    } catch {}
  }, []);

  const fetchNotifications = useCallback(async (pageNum = 0, append = false) => {
    try {
      if (pageNum === 0) setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setNotifications([]); setUnreadCount(0); setLoading(false); return; }

      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from('notifications')
        .select('id, user_id, title, body, data, type, sound, read, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const notifs = data || [];
      setHasMore(notifs.length === PAGE_SIZE);

      if (append) {
        setNotifications(prev => [...prev, ...notifs]);
      } else {
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
      }
      setPage(pageNum);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (hasMore) fetchNotifications(page + 1, true);
  }, [hasMore, page, fetchNotifications]);

  useEffect(() => {
    let notificationsChannel: ReturnType<typeof supabase.channel> | null = null;
    let isMounted = true;

    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      if (!userId) return;

      notificationsChannel = supabase
        .channel(`notifications-supplier-display-${userId}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'notifications',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          if (!isMounted) return;
          const newNotif = payload.new as SupplierNotification;
          if (newNotif.sound) playNotificationSound();
          toast({ title: newNotif.title, description: newNotif.body });
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
        })
        .subscribe();
    };

    fetchNotifications(0);
    setupRealtimeSubscription();

    return () => {
      isMounted = false;
      if (notificationsChannel) supabase.removeChannel(notificationsChannel);
    };
  }, [fetchNotifications, playNotificationSound, toast]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
      if (error) throw error;
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) { console.error('Error marking notification as read:', error); }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
      if (error) throw error;
      toast({ title: 'Notificações marcadas como lidas' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error: any) { console.error('Error marking all as read:', error); }
  };

  return { notifications, loading, unreadCount, hasMore, loadMore, pushPermission, requestPermission, markAsRead, markAllAsRead, refetch: () => fetchNotifications(0) };
};
