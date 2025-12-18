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
  reference_id?: string;
  reference_type?: 'order' | 'supplier' | 'payout';
  read: boolean;
  created_at: string;
}

// Transform database notifications to admin format
const transformNotification = (notif: any): AdminNotification => {
  const data = notif.data as Record<string, any> || {};
  
  // Determine type based on notification type and content
  let adminType: AdminNotificationType = 'alert';
  if (notif.type === 'order_update') {
    adminType = 'sale';
  } else if (notif.type === 'payout') {
    adminType = 'commission';
  } else if (notif.type === 'admin') {
    adminType = data.admin_type || 'alert';
  }

  return {
    id: notif.id,
    type: adminType,
    title: notif.title,
    body: notif.body,
    value: data.total || data.amount || data.commission,
    reference_id: data.order_id || data.supplier_id || data.payout_id,
    reference_type: data.order_id ? 'order' : data.supplier_id ? 'supplier' : data.payout_id ? 'payout' : undefined,
    read: notif.read,
    created_at: notif.created_at
  };
};

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
      
      // Fetch notifications for admin users (type = 'admin' or targeted to admins)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('type', 'admin')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        // If RLS blocks, try fetching all order_update and payout notifications
        console.log('Fetching admin notifications via alternative method');
        const { data: allNotifs, error: altError } = await supabase
          .from('notifications')
          .select('*')
          .in('type', ['order_update', 'payout', 'admin'])
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (altError) throw altError;
        
        const transformed = (allNotifs || []).map(transformNotification);
        setNotifications(transformed);
        setUnreadCount(transformed.filter(n => !n.read).length);
        return;
      }
      
      const transformed = (data || []).map(transformNotification);
      setNotifications(transformed);
      setUnreadCount(transformed.filter(n => !n.read).length);
    } catch (error: any) {
      console.error('Error fetching admin notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Subscribe to realtime changes for admin notifications
    const channel = supabase
      .channel('admin-notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          const newNotif = payload.new as any;
          
          // Only process admin-relevant notifications
          if (['order_update', 'payout', 'admin'].includes(newNotif.type)) {
            playNotificationSound();
            toast({
              title: newNotif.title,
              description: newNotif.body,
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
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds);

      if (error) throw error;
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      toast({
        title: 'Notificações marcadas como lidas',
      });
    } catch (error: any) {
      console.error('Error marking all as read:', error);
      toast({
        title: 'Erro ao marcar como lidas',
        variant: 'destructive',
      });
    }
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
