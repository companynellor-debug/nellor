import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export interface CartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  storeId: number;
  storeName: string;
  minQuantity?: number;
  minValue?: number;
}

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('cart');
    if (stored) {
      setCartItems(JSON.parse(stored));
    }
  }, []);

  const saveCart = (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem('cart', JSON.stringify(items));
  };

  const addToCart = (item: Omit<CartItem, 'id' | 'quantity'>, requestedQuantity: number = 1) => {
    const currentStoreId = cartItems.length > 0 ? cartItems[0].storeId : null;
    
    if (currentStoreId && currentStoreId !== item.storeId) {
      toast({
        title: "Atenção",
        description: "Você só pode comprar produtos de um fornecedor por vez. Limpe o carrinho primeiro.",
        variant: "destructive"
      });
      return false;
    }

    const existingItem = cartItems.find(i => i.productId === item.productId);
    
    if (existingItem) {
      const updated = cartItems.map(i => 
        i.productId === item.productId 
          ? { ...i, quantity: i.quantity + requestedQuantity }
          : i
      );
      saveCart(updated);
    } else {
      const newItem: CartItem = {
        ...item,
        id: Date.now(),
        quantity: requestedQuantity
      };
      saveCart([...cartItems, newItem]);
    }

    toast({
      title: "Adicionado ao carrinho",
      description: `${item.name} foi adicionado ao seu carrinho.`
    });
    return true;
  };

  const updateQuantity = (id: number, delta: number) => {
    const updated = cartItems.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    saveCart(updated);
  };

  const removeItem = (id: number) => {
    const updated = cartItems.filter(item => item.id !== id);
    saveCart(updated);
    toast({
      title: "Item removido",
      description: "O item foi removido do carrinho."
    });
  };

  const clearCart = () => {
    saveCart([]);
  };

  const getTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getStoreId = () => {
    return cartItems.length > 0 ? cartItems[0].storeId : null;
  };

  const validateMinimumLimits = () => {
    const errors: string[] = [];
    
    cartItems.forEach(item => {
      // Validar quantidade mínima
      if (item.minQuantity && item.quantity < item.minQuantity) {
        errors.push(`${item.name}: quantidade mínima de ${item.minQuantity} unidades`);
      }
      
      // Validar valor mínimo
      if (item.minValue) {
        const itemTotal = item.price * item.quantity;
        if (itemTotal < item.minValue) {
          errors.push(`${item.name}: valor mínimo de R$ ${item.minValue.toFixed(2)}`);
        }
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  return {
    cartItems,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    getTotal,
    getStoreId,
    validateMinimumLimits,
    itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
  };
};
