import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const usePresence = (userId?: string) => {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [lastSeenMap, setLastSeenMap] = useState<Record<string, string>>({});
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel('global-presence');
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online = new Set<string>();
        Object.values(state).forEach((presences: any[]) => {
          presences.forEach((p) => {
            if (p.user_id) online.add(p.user_id);
          });
        });
        setOnlineUsers(online);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: userId, online_at: new Date().toISOString() });
        }
      });

    // Update last_seen_at every 60s
    const updateLastSeen = async () => {
      await supabase
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() } as any)
        .eq('id', userId);
    };
    updateLastSeen();
    updateIntervalRef.current = setInterval(updateLastSeen, 60000);

    return () => {
      if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchLastSeen = useCallback(async (userIds: string[]) => {
    if (userIds.length === 0) return;
    const missing = userIds.filter(id => !lastSeenMap[id]);
    if (missing.length === 0) return;

    const { data } = await supabase
      .from('profiles')
      .select('id, last_seen_at')
      .in('id', missing);

    if (data) {
      const newMap: Record<string, string> = {};
      data.forEach((p: any) => {
        if (p.last_seen_at) newMap[p.id] = p.last_seen_at;
      });
      setLastSeenMap(prev => ({ ...prev, ...newMap }));
    }
  }, [lastSeenMap]);

  const isUserOnline = useCallback((uid: string) => onlineUsers.has(uid), [onlineUsers]);

  const getLastSeenText = useCallback((uid: string) => {
    if (onlineUsers.has(uid)) return 'Online';
    const lastSeen = lastSeenMap[uid];
    if (!lastSeen) return 'Offline';
    try {
      return `Visto ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true, locale: ptBR })}`;
    } catch {
      return 'Offline';
    }
  }, [onlineUsers, lastSeenMap]);

  return { isUserOnline, getLastSeenText, fetchLastSeen, onlineUsers };
};
