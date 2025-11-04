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

  const addToCart = (item: Omit<CartItem, 'id' | 'quantity'>) => {
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
          ? { ...i, quantity: i.quantity + 1 }
          : i
      );
      saveCart(updated);
    } else {
      const newItem: CartItem = {
        ...item,
        id: Date.now(),
        quantity: 1
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

  return {
    cartItems,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    getTotal,
    getStoreId,
    itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
  };
};
