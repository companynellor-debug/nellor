import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { stores as mockStores, Store } from '@/data/stores';
import { useAuth } from './useAuth';
import { useStoreProfile } from './useStoreProfile';

interface StoresContextType {
  stores: Store[];
  getAllStores: () => Store[];
}

const StoresContext = createContext<StoresContextType | undefined>(undefined);

export const StoresProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { storeProfile } = useStoreProfile();
  const [stores, setStores] = useState<Store[]>(mockStores);

  useEffect(() => {
    // Se o usuário for fornecedor e tiver configurado a loja, adicionar aos stores
    if (user?.type === 'fornecedor' && storeProfile.storeName) {
      // Gerar ID consistente baseado no user ID
      const hashCode = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        return Math.abs(hash);
      };

      const supplierStore: Store = {
        id: hashCode(user.id),
        name: storeProfile.storeName,
        bio: storeProfile.bio || '',
        avatar: storeProfile.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=store',
        banner: storeProfile.banner || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
        rating: 5.0,
        totalSales: 0,
        totalReviews: 0,
        reviews: []
      };

      // Verificar se a loja já existe na lista
      setStores(prev => {
        const existingIndex = prev.findIndex(s => s.id === supplierStore.id);
        if (existingIndex >= 0) {
          // Atualizar loja existente
          const updated = [...prev];
          updated[existingIndex] = supplierStore;
          return updated;
        } else {
          // Adicionar nova loja
          return [...prev, supplierStore];
        }
      });
    }
  }, [user, storeProfile]);

  const getAllStores = () => stores;

  return (
    <StoresContext.Provider value={{ stores, getAllStores }}>
      {children}
    </StoresContext.Provider>
  );
};

export const useStores = () => {
  const context = useContext(StoresContext);
  if (context === undefined) {
    throw new Error('useStores must be used within StoresProvider');
  }
  return context;
};
