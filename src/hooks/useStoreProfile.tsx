import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface StoreProfile {
  storeName: string;
  bio: string;
  avatar: string;
  banner: string;
  cnpj?: string;
  whatsapp?: string;
  address?: string;
  pixKey?: string;
  minOrderQuantity?: number;
  minOrderValue?: number;
  customCategories?: string[];
}

interface StoreProfileContextType {
  storeProfile: StoreProfile;
  updateStoreProfile: (profile: Partial<StoreProfile>) => void;
}

const StoreProfileContext = createContext<StoreProfileContextType | undefined>(undefined);

export const StoreProfileProvider = ({ children }: { children: ReactNode }) => {
  const [storeProfile, setStoreProfile] = useState<StoreProfile>(() => {
    const saved = localStorage.getItem('store_profile');
    return saved ? JSON.parse(saved) : {
      storeName: '',
      bio: '',
      avatar: '',
      banner: '',
      cnpj: '',
      whatsapp: '',
      address: '',
      pixKey: '',
      minOrderQuantity: 0,
      minOrderValue: 0,
      customCategories: []
    };
  });

  useEffect(() => {
    localStorage.setItem('store_profile', JSON.stringify(storeProfile));
  }, [storeProfile]);

  const updateStoreProfile = (newProfile: Partial<StoreProfile>) => {
    setStoreProfile(prev => ({ ...prev, ...newProfile }));
  };

  return (
    <StoreProfileContext.Provider value={{ storeProfile, updateStoreProfile }}>
      {children}
    </StoreProfileContext.Provider>
  );
};

export const useStoreProfile = () => {
  const context = useContext(StoreProfileContext);
  if (context === undefined) {
    throw new Error('useStoreProfile must be used within StoreProfileProvider');
  }
  return context;
};
