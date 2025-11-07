import { useState, useEffect } from 'react';

export interface PaymentMethod {
  id: string;
  type: 'pix' | 'card';
  pixKey?: string;
  cardNumber?: string;
  cardHolder?: string;
  cardBrand?: string;
  cardExpiry?: string;
  isDefault: boolean;
}

export const usePaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() => {
    const saved = localStorage.getItem('user_payment_methods');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('user_payment_methods', JSON.stringify(paymentMethods));
  }, [paymentMethods]);

  const addPaymentMethod = (method: Omit<PaymentMethod, 'id'>) => {
    const newMethod: PaymentMethod = {
      ...method,
      id: Date.now().toString()
    };

    if (newMethod.isDefault) {
      setPaymentMethods(prev => 
        [...prev.map(m => ({ ...m, isDefault: false })), newMethod]
      );
    } else {
      setPaymentMethods(prev => [...prev, newMethod]);
    }

    return newMethod;
  };

  const updatePaymentMethod = (id: string, updates: Partial<PaymentMethod>) => {
    setPaymentMethods(prev => 
      prev.map(method => 
        method.id === id ? { ...method, ...updates } : method
      )
    );
  };

  const deletePaymentMethod = (id: string) => {
    setPaymentMethods(prev => prev.filter(method => method.id !== id));
  };

  const getDefaultPaymentMethod = () => {
    return paymentMethods.find(method => method.isDefault);
  };

  const setDefaultPaymentMethod = (id: string) => {
    setPaymentMethods(prev => 
      prev.map(method => ({
        ...method,
        isDefault: method.id === id
      }))
    );
  };

  return {
    paymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    getDefaultPaymentMethod,
    setDefaultPaymentMethod
  };
};
