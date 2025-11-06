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
  const [orders, setOrders] = useState<SupplierOrder[]>([]);

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
