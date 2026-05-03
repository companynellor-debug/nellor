import { useState, useEffect } from 'react';

export interface MessageAttachment {
  type: 'image' | 'video' | 'file';
  url: string;
  name: string;
}

export interface Message {
  id: string;
  storeId: number;
  text: string;
  sender: 'user' | 'store';
  timestamp: string;
  attachments?: MessageAttachment[];
  read: boolean;
}

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('chatMessages');
    if (stored) {
      setMessages(JSON.parse(stored));
    }
  }, []);

  const saveMessages = (newMessages: Message[]) => {
    setMessages(newMessages);
    localStorage.setItem('chatMessages', JSON.stringify(newMessages));
  };

  const sendMessage = (
    storeId: number, 
    text: string, 
    attachments?: MessageAttachment[]
  ) => {
    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      storeId,
      text,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      attachments,
      read: true
    };

    saveMessages([...messages, newMessage]);
    return newMessage;
  };

  const getMessagesByStore = (storeId: number) => {
    return messages.filter(msg => msg.storeId === storeId);
  };

  const markAsRead = (storeId: number) => {
    const updated = messages.map(msg => 
      msg.storeId === storeId ? { ...msg, read: true } : msg
    );
    saveMessages(updated);
  };

  const getUnreadCount = (storeId: number) => {
    return messages.filter(msg => 
      msg.storeId === storeId && msg.sender === 'store' && !msg.read
    ).length;
  };

  return {
    messages,
    sendMessage,
    getMessagesByStore,
    markAsRead,
    getUnreadCount
  };
};
