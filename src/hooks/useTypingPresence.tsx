import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TypingUser {
  oderId: string;
  isTyping: boolean;
}

export const useTypingPresence = (chatId: string, userId: string | undefined) => {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!chatId || !userId) return;

    const channelName = `typing:${chatId}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const typing = new Set<string>();
        
        Object.values(state).forEach((presences: any[]) => {
          presences.forEach((presence) => {
            if (presence.isTyping && presence.userId !== userId) {
              typing.add(presence.userId);
            }
          });
        });
        
        setTypingUsers(typing);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        newPresences.forEach((presence: any) => {
          if (presence.isTyping && presence.userId !== userId) {
            setTypingUsers(prev => new Set(prev).add(presence.userId));
          }
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        leftPresences.forEach((presence: any) => {
          setTypingUsers(prev => {
            const next = new Set(prev);
            next.delete(presence.userId);
            return next;
          });
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId,
            isTyping: false,
          });
        }
      });

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [chatId, userId]);

  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!channelRef.current || !userId) return;

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    await channelRef.current.track({
      userId,
      isTyping,
    });

    // Auto-stop typing after 3 seconds
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(async () => {
        if (channelRef.current) {
          await channelRef.current.track({
            userId,
            isTyping: false,
          });
        }
      }, 3000);
    }
  }, [userId]);

  const startTyping = useCallback(() => {
    setTyping(true);
  }, [setTyping]);

  const stopTyping = useCallback(() => {
    setTyping(false);
  }, [setTyping]);

  const isOtherUserTyping = typingUsers.size > 0;

  return {
    isOtherUserTyping,
    typingUsers: Array.from(typingUsers),
    startTyping,
    stopTyping,
  };
};
