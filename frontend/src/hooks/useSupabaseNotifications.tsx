import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { requestNotificationPermission, getNotificationPermission } from '@/utils/pushNotifications';

export interface Notification {
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

const checkIfSupplier = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;
    const { data: profile } = await supabase.from('profiles').select('tipo').eq('id', session.user.id).single();
    return profile?.tipo === 'fornecedor' || profile?.tipo === 'admin';
  } catch { return false; }
};

export const useSupabaseNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isSupplier, setIsSupplier] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  const requestPushPermission = useCallback(async () => {
    const supplierCheck = await checkIfSupplier();
    if (!supplierCheck) return false;
    const granted = await requestNotificationPermission();
    setPushPermission(getNotificationPermission());
    return granted;
  }, []);

  useEffect(() => {
    setPushPermission(getNotificationPermission());
    checkIfSupplier().then(setIsSupplier);
  }, []);

  const playNotificationSound = useCallback(() => {
    const audio = new Audio('/notification-sound.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {});
  }, []);

  const fetchNotifications = useCallback(async (pageNum = 0, append = false) => {
    try {
      if (pageNum === 0) setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setNotifications([]); setUnreadCount(0); setLoading(false); return; }
      const userId = session.user.id;

      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from('notifications')
        .select('id, user_id, title, body, data, type, sound, read, created_at')
        .eq('user_id', userId)
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
    let userId: string | null = null;

    const setupRealtimeSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id || null;
      if (!userId) return;

      const notificationsChannel = supabase
        .channel('notifications-realtime-display')
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'notifications',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          const newNotif = payload.new as Notification;
          checkIfSupplier().then(isSupp => {
            if (isSupp) {
              if (newNotif.sound) playNotificationSound();
              toast({ title: newNotif.title, description: newNotif.body });
            }
          });
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
        })
        .subscribe();

      return () => { supabase.removeChannel(notificationsChannel); };
    };

    fetchNotifications(0);
    const cleanup = setupRealtimeSubscription();
    return () => { cleanup.then(fn => fn?.()); };
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', session.user.id).eq('read', false);
      if (error) throw error;
      toast({ title: 'Notificações marcadas como lidas' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error: any) {
      console.error('Error marking all as read:', error);
      toast({ title: 'Erro ao marcar como lidas', description: error.message, variant: 'destructive' });
    }
  };

  return { notifications, loading, unreadCount, hasMore, loadMore, pushPermission, requestPushPermission, markAsRead, markAllAsRead, refetch: () => fetchNotifications(0) };
};
