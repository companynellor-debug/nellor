export interface Store {
  id: number;
  name: string;
  bio: string;
  avatar: string;
  banner: string;
  rating: number;
  totalSales: number;
  totalReviews: number;
  reviews: {
    name: string;
    rating: number;
    comment: string;
    date: string;
  }[];
}

// Dados fictícios removidos - agora usando dados reais do Supabase
export const stores: Store[] = [];

export const getStoreById = (id: number): Store | undefined => {
  return stores.find((store) => store.id === id);
};

export const getAllStores = (): Store[] => {
  return stores;
};
