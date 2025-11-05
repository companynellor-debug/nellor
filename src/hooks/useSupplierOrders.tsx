import { createContext, useContext, useState, ReactNode } from 'react';

export type OrderStatus = 'awaiting_payment' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

export interface SupplierOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  product: string;
  value: number;
  status: OrderStatus;
  date: string;
  paymentProof?: string;
}

interface SupplierOrdersContextType {
  orders: SupplierOrder[];
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  addPaymentProof: (orderId: string, proof: string) => void;
}

const SupplierOrdersContext = createContext<SupplierOrdersContextType | undefined>(undefined);

export const SupplierOrdersProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<SupplierOrder[]>([
    {
      id: '#1452',
      customerName: 'João M.',
      customerEmail: 'joao@email.com',
      product: 'Produto Premium',
      value: 120.00,
      status: 'awaiting_payment',
      date: '02/11/2024',
    },
    {
      id: '#1453',
      customerName: 'Maria C.',
      customerEmail: 'maria@email.com',
      product: 'Kit Completo',
      value: 90.00,
      status: 'preparing',
      date: '03/11/2024',
    },
    {
      id: '#1454',
      customerName: 'Pedro S.',
      customerEmail: 'pedro@email.com',
      product: 'Combo Especial',
      value: 200.00,
      status: 'delivered',
      date: '01/11/2024',
    },
  ]);

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status } : order
    ));
  };

  const addPaymentProof = (orderId: string, proof: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, paymentProof: proof } : order
    ));
  };

  return (
    <SupplierOrdersContext.Provider value={{ orders, updateOrderStatus, addPaymentProof }}>
      {children}
    </SupplierOrdersContext.Provider>
  );
};

export const useSupplierOrders = () => {
  const context = useContext(SupplierOrdersContext);
  if (context === undefined) {
    throw new Error('useSupplierOrders must be used within SupplierOrdersProvider');
  }
  return context;
};
