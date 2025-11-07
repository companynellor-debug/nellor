import { useState, useEffect } from 'react';

export interface SupportMessage {
  id: string;
  userId: string;
  userName: string;
  userType: 'cliente' | 'fornecedor';
  text: string;
  sender: 'user' | 'admin';
  timestamp: string;
  read: boolean;
  subject?: string;
}

export const useSupportMessages = () => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('supportMessages');
    if (stored) {
      setMessages(JSON.parse(stored));
    }
  }, []);

  const saveMessages = (newMessages: SupportMessage[]) => {
    setMessages(newMessages);
    localStorage.setItem('supportMessages', JSON.stringify(newMessages));
  };

  const sendMessage = (
    userId: string,
    userName: string,
    userType: 'cliente' | 'fornecedor',
    text: string,
    sender: 'user' | 'admin',
    subject?: string
  ) => {
    const newMessage: SupportMessage = {
      id: `support_${Date.now()}`,
      userId,
      userName,
      userType,
      text,
      sender,
      timestamp: new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      read: sender === 'admin',
      subject
    };

    saveMessages([...messages, newMessage]);
    return newMessage;
  };

  const getMessagesByUser = (userId: string) => {
    return messages.filter(msg => msg.userId === userId);
  };

  const markAsRead = (userId: string) => {
    const updated = messages.map(msg => 
      msg.userId === userId ? { ...msg, read: true } : msg
    );
    saveMessages(updated);
  };

  const getUnreadCount = (userId: string) => {
    return messages.filter(msg => 
      msg.userId === userId && msg.sender === 'admin' && !msg.read
    ).length;
  };

  const getConversations = () => {
    const conversationsMap = new Map();
    messages.forEach(msg => {
      if (!conversationsMap.has(msg.userId)) {
        conversationsMap.set(msg.userId, {
          userId: msg.userId,
          userName: msg.userName,
          userType: msg.userType,
          lastMessage: msg,
          unreadCount: 0
        });
      } else {
        const conv = conversationsMap.get(msg.userId);
        if (new Date(msg.timestamp) > new Date(conv.lastMessage.timestamp)) {
          conv.lastMessage = msg;
        }
      }
      
      if (msg.sender === 'user' && !msg.read) {
        const conv = conversationsMap.get(msg.userId);
        conv.unreadCount++;
      }
    });
    
    return Array.from(conversationsMap.values()).sort((a, b) => 
      new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
    );
  };

  return {
    messages,
    sendMessage,
    getMessagesByUser,
    markAsRead,
    getUnreadCount,
    getConversations
  };
};
