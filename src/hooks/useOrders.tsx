import { useState, useEffect } from 'react';

export type OrderStatus = 
  | 'pendente_pagamento' 
  | 'aguardando_confirmacao' 
  | 'preparando' 
  | 'enviado' 
  | 'entregue'
  | 'recusado';

export interface OrderItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  date: string;
  total: number;
  status: OrderStatus;
  items: OrderItem[];
  storeId: number;
  storeName: string;
  shippingAddress: {
    name: string;
    document: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  paymentProof?: string;
  canReview?: boolean;
  trackingCode?: string;
}

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('orders');
    if (stored) {
      setOrders(JSON.parse(stored));
    }
  }, []);

  const saveOrders = (newOrders: Order[]) => {
    setOrders(newOrders);
    localStorage.setItem('orders', JSON.stringify(newOrders));
  };

  const createOrder = (order: Omit<Order, 'id' | 'date' | 'canReview'>) => {
    const newOrder: Order = {
      ...order,
      id: `PED${Date.now()}`,
      date: new Date().toLocaleDateString('pt-BR'),
      canReview: false
    };
    saveOrders([newOrder, ...orders]);
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    const updated = orders.map(order => {
      if (order.id === orderId) {
        return { 
          ...order, 
          status,
          canReview: status === 'entregue'
        };
      }
      return order;
    });
    saveOrders(updated);
  };

  const updatePaymentProof = (orderId: string, proof: string) => {
    const updated = orders.map(order => {
      if (order.id === orderId) {
        return { 
          ...order, 
          paymentProof: proof,
          status: 'aguardando_confirmacao' as OrderStatus
        };
      }
      return order;
    });
    saveOrders(updated);
  };

  const getOrderById = (orderId: string) => {
    return orders.find(order => order.id === orderId);
  };

  const updateTrackingCode = (orderId: string, trackingCode: string) => {
    const updated = orders.map(order => {
      if (order.id === orderId) {
        return { ...order, trackingCode };
      }
      return order;
    });
    saveOrders(updated);
  };

  return {
    orders,
    createOrder,
    updateOrderStatus,
    updatePaymentProof,
    updateTrackingCode,
    getOrderById
  };
};
