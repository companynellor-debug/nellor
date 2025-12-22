import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

export const useSupabaseNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const { toast } = useToast();

  // Check and request push notification permission
  const requestPushPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      setPushPermission('granted');
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      return permission === 'granted';
    }

    setPushPermission('denied');
    return false;
  }, []);

  // Initialize permission state
  useEffect(() => {
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    const audio = new Audio('/notification-sound.mp3');
    audio.volume = 0.5;
    audio.play().catch(error => {
      console.error('Error playing notification sound:', error);
    });
  }, []);

  const showBrowserNotification = useCallback((title: string, body: string, data?: any) => {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: data?.order_id || 'nellor-notification',
        requireInteraction: false,
        silent: false, // We play our own sound
      });

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Navigate to relevant page based on notification type
        if (data?.order_id) {
          window.location.href = '/cliente/meus-pedidos';
        }
      };

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    }
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

      // Subscribe to realtime changes for this user's notifications
      const channel = supabase
        .channel('notifications-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const newNotif = payload.new as Notification;
            
            // Play sound for new notification
            if (newNotif.sound) {
              playNotificationSound();
            }

            // Show browser push notification
            showBrowserNotification(newNotif.title, newNotif.body, newNotif.data);
            
            // Show in-app toast
            toast({
              title: newNotif.title,
              description: newNotif.body,
            });
            
            // Update notifications list
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    fetchNotifications();
    const cleanup = setupRealtimeSubscription();

    return () => {
      cleanup.then(fn => fn?.());
    };
  }, [fetchNotifications, playNotificationSound, showBrowserNotification, toast]);

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
      toast({
        title: 'Erro ao marcar como lidas',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return {
    notifications,
    loading,
    unreadCount,
    pushPermission,
    requestPushPermission,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  };
};
