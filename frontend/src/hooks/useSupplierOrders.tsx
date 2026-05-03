import { createContext, useContext, useState, ReactNode } from 'react';

export type OrderStatus = 'awaiting_payment' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ShippingAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  date: string;
  time: string;
}

export interface SupplierOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  product: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  value: number;
  shippingCost: number;
  totalValue: number;
  status: OrderStatus;
  statusHistory: StatusHistoryEntry[];
  date: string;
  paymentProof?: string;
  paymentMethod: string;
  notes?: string;
  trackingCode?: string;
  tags: string[];
}

interface SupplierOrdersContextType {
  orders: SupplierOrder[];
  updateOrderStatus: (orderId: string, status: OrderStatus, onDelivered?: () => void) => void;
  addPaymentProof: (orderId: string, proof: string) => void;
  updateTrackingCode: (orderId: string, trackingCode: string) => void;
  addTag: (orderId: string, tag: string) => void;
  removeTag: (orderId: string, tag: string) => void;
}

const SupplierOrdersContext = createContext<SupplierOrdersContextType | undefined>(undefined);

export const SupplierOrdersProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<SupplierOrder[]>([]);

  const updateOrderStatus = (orderId: string, status: OrderStatus, onDelivered?: () => void) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const now = new Date();
        const newHistoryEntry: StatusHistoryEntry = {
          status,
          date: now.toLocaleDateString('pt-BR'),
          time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        
        // Callback quando pedido é marcado como entregue
        if (status === 'delivered' && onDelivered) {
          onDelivered();
        }
        
        return {
          ...order,
          status,
          statusHistory: [...order.statusHistory, newHistoryEntry]
        };
      }
      return order;
    }));
  };

  const addPaymentProof = (orderId: string, proof: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, paymentProof: proof } : order
    ));
  };

  const updateTrackingCode = (orderId: string, trackingCode: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, trackingCode } : order
    ));
  };

  const addTag = (orderId: string, tag: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId && !order.tags.includes(tag)) {
        return { ...order, tags: [...order.tags, tag] };
      }
      return order;
    }));
  };

  const removeTag = (orderId: string, tag: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return { ...order, tags: order.tags.filter(t => t !== tag) };
      }
      return order;
    }));
  };

  return (
    <SupplierOrdersContext.Provider value={{ orders, updateOrderStatus, addPaymentProof, updateTrackingCode, addTag, removeTag }}>
      {children}
    </SupplierOrdersContext.Provider>
  );
};

const noopOrdersContext: SupplierOrdersContextType = {
  orders: [],
  updateOrderStatus: () => {},
  addPaymentProof: () => {},
  updateTrackingCode: () => {},
  addTag: () => {},
  removeTag: () => {},
};

export const useSupplierOrders = () => {
  const context = useContext(SupplierOrdersContext);
  return context ?? noopOrdersContext;
};
