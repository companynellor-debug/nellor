import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from './useSupabaseAuth';
import { toast } from 'sonner';

export interface MessageAttachment {
  type: 'image' | 'video' | 'file';
  url: string;
  name: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  from_user: string;
  to_user: string;
  text: string;
  attachments?: string[];
  read: boolean;
  created_at: string;
}

export const useSupabaseMessages = (supplierId?: string) => {
  const { user } = useSupabaseAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    fetchMessages();

    // Realtime subscription - subscribe to ALL messages changes and filter client-side
    const channel = supabase
      .channel(`messages_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          // Only add if message involves current user
          if (newMsg.from_user === user.id || newMsg.to_user === user.id) {
            setMessages(prev => {
              // Avoid duplicates
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            
            // Play notification sound when receiving a message from someone else
            if (newMsg.to_user === user.id && newMsg.from_user !== user.id) {
              try {
                const audio = new Audio('/notification-sound.mp3');
                audio.volume = 0.5;
                audio.play().catch(err => console.log('Could not play notification sound:', err));
              } catch (err) {
                console.log('Error creating audio:', err);
              }
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const updatedMsg = payload.new as ChatMessage;
          if (updatedMsg.from_user === user.id || updatedMsg.to_user === user.id) {
            setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchMessages = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`from_user.eq.${user.id},to_user.eq.${user.id}`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (
    toUserId: string,
    text: string,
    attachments?: MessageAttachment[]
  ) => {
    if (!user?.id) {
      toast.error('Você precisa estar logado para enviar mensagens');
      return;
    }

    try {
      const chatId = [user.id, toUserId].sort().join('_');
      
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          from_user: user.id,
          to_user: toUserId,
          text: text,
          attachments: attachments?.map(att => att.url) || [],
          read: false
        });

      if (error) throw error;
      
      toast.success('Mensagem enviada com sucesso');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    }
  };

  const getConversations = () => {
    if (!user?.id) return [];

    const conversationsMap = new Map<string, {
      userId: string;
      lastMessage: ChatMessage;
      unreadCount: number;
    }>();

    messages.forEach(msg => {
      const otherUserId = msg.from_user === user.id ? msg.to_user : msg.from_user;
      
      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          userId: otherUserId,
          lastMessage: msg,
          unreadCount: 0
        });
      } else {
        const conv = conversationsMap.get(otherUserId)!;
        if (new Date(msg.created_at) > new Date(conv.lastMessage.created_at)) {
          conv.lastMessage = msg;
        }
      }
      
      if (msg.to_user === user.id && !msg.read) {
        const conv = conversationsMap.get(otherUserId)!;
        conv.unreadCount++;
      }
    });

    return Array.from(conversationsMap.values()).sort((a, b) => 
      new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
    );
  };

  const getMessagesByUser = (otherUserId: string) => {
    return messages.filter(msg => 
      (msg.from_user === user?.id && msg.to_user === otherUserId) ||
      (msg.from_user === otherUserId && msg.to_user === user?.id)
    );
  };

  const markAsRead = async (otherUserId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('from_user', otherUserId)
        .eq('to_user', user.id)
        .eq('read', false);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const getUnreadCount = (otherUserId: string) => {
    if (!user?.id) return 0;
    
    return messages.filter(msg => 
      msg.from_user === otherUserId && 
      msg.to_user === user.id && 
      !msg.read
    ).length;
  };

  return {
    messages,
    loading,
    sendMessage,
    getConversations,
    getMessagesByUser,
    markAsRead,
    getUnreadCount
  };
};
