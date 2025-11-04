import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "@/hooks/use-toast";

interface StoresFavoritesContextType {
  favoriteStores: number[];
  addFavoriteStore: (storeId: number) => void;
  removeFavoriteStore: (storeId: number) => void;
  isFavoriteStore: (storeId: number) => boolean;
}

const StoresFavoritesContext = createContext<StoresFavoritesContextType | undefined>(undefined);

export const StoresFavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favoriteStores, setFavoriteStores] = useState<number[]>(() => {
    const saved = localStorage.getItem("favoriteStores");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("favoriteStores", JSON.stringify(favoriteStores));
  }, [favoriteStores]);

  const addFavoriteStore = (storeId: number) => {
    setFavoriteStores((prev) => {
      if (prev.includes(storeId)) return prev;
      toast({
        title: "Loja favoritada",
        description: "Loja adicionada aos favoritos!",
      });
      return [...prev, storeId];
    });
  };

  const removeFavoriteStore = (storeId: number) => {
    setFavoriteStores((prev) => {
      toast({
        title: "Removida dos favoritos",
        description: "Loja removida dos favoritos!",
      });
      return prev.filter((id) => id !== storeId);
    });
  };

  const isFavoriteStore = (storeId: number) => favoriteStores.includes(storeId);

  return (
    <StoresFavoritesContext.Provider value={{ favoriteStores, addFavoriteStore, removeFavoriteStore, isFavoriteStore }}>
      {children}
    </StoresFavoritesContext.Provider>
  );
};

export const useStoresFavorites = () => {
  const context = useContext(StoresFavoritesContext);
  if (!context) {
    throw new Error("useStoresFavorites must be used within StoresFavoritesProvider");
  }
  return context;
};
