import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export interface CartItem {
  id: number;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  storeId: string;
  storeName: string;
  minQuantity?: number;
  minValue?: number;
  selectedSize?: string;
  selectedColor?: string;
  /** All variation selections, e.g. {"Cor":"Preto","Memória":"128GB","RAM":"6GB"} */
  variations?: Record<string, string>;
  /** Image specific to the selected color variation */
  variationImage?: string;
}

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const syncFromStorage = () => {
    const stored = localStorage.getItem('cart');
    setCartItems(stored ? JSON.parse(stored) : []);
  };

  useEffect(() => {
    syncFromStorage();
    const handleStorage = (e: StorageEvent) => { if (e.key === 'cart') syncFromStorage(); };
    const handleCustom = () => syncFromStorage();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('cart:updated', handleCustom as EventListener);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('cart:updated', handleCustom as EventListener);
    };
  }, []);

  const saveCart = (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem('cart', JSON.stringify(items));
    window.dispatchEvent(new Event('cart:updated'));
  };

  const addToCart = (item: Omit<CartItem, 'id' | 'quantity'>, requestedQuantity: number = 1) => {
    const currentStoreId = cartItems.length > 0 ? cartItems[0].storeId : null;
    if (currentStoreId && currentStoreId !== item.storeId) {
      toast({ title: "Atenção", description: "Você só pode comprar produtos de um fornecedor por vez. Limpe o carrinho primeiro.", variant: "destructive" });
      return false;
    }

    // Build a unique key from productId + all variation values
    const variationKey = item.variations
      ? Object.values(item.variations).sort().join('|')
      : `${item.selectedSize || ''}|${item.selectedColor || ''}`;

    const existingItem = cartItems.find(i => {
      const existingKey = i.variations
        ? Object.values(i.variations).sort().join('|')
        : `${i.selectedSize || ''}|${i.selectedColor || ''}`;
      return i.productId === item.productId && existingKey === variationKey;
    });

    if (existingItem) {
      const updated = cartItems.map(i => {
        const iKey = i.variations
          ? Object.values(i.variations).sort().join('|')
          : `${i.selectedSize || ''}|${i.selectedColor || ''}`;
        return (i.productId === item.productId && iKey === variationKey)
          ? { ...i, quantity: i.quantity + requestedQuantity }
          : i;
      });
      saveCart(updated);
    } else {
      const newItem: CartItem = { ...item, id: Date.now(), quantity: requestedQuantity };
      saveCart([...cartItems, newItem]);
    }

    toast({ title: "Adicionado ao carrinho", description: `${item.name} foi adicionado ao seu carrinho.` });
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
    toast({ title: "Item removido", description: "O item foi removido do carrinho." });
  };

  const clearCart = () => { saveCart([]); };

  const getTotal = () => cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const getStoreId = () => cartItems.length > 0 ? cartItems[0].storeId : null;

  const validateMinimumLimits = () => {
    const errors: string[] = [];
    cartItems.forEach(item => {
      if (item.minQuantity && item.quantity < item.minQuantity) {
        errors.push(`${item.name}: quantidade mínima de ${item.minQuantity} unidades`);
      }
      if (item.minValue) {
        const itemTotal = item.price * item.quantity;
        if (itemTotal < item.minValue) {
          errors.push(`${item.name}: valor mínimo de R$ ${item.minValue.toFixed(2)}`);
        }
      }
    });
    return { isValid: errors.length === 0, errors };
  };

  return {
    cartItems, addToCart, updateQuantity, removeItem, clearCart, getTotal, getStoreId, validateMinimumLimits,
    itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
  };
};
