import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "@/hooks/use-toast";

interface StoresFavoritesContextType {
  favoriteStores: string[];
  addFavoriteStore: (storeId: string) => void;
  removeFavoriteStore: (storeId: string) => void;
  isFavoriteStore: (storeId: string) => boolean;
}

const StoresFavoritesContext = createContext<StoresFavoritesContextType | undefined>(undefined);

export const StoresFavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favoriteStores, setFavoriteStores] = useState<string[]>(() => {
    const saved = localStorage.getItem("favoriteStores");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("favoriteStores", JSON.stringify(favoriteStores));
  }, [favoriteStores]);

  const addFavoriteStore = (storeId: string) => {
    setFavoriteStores((prev) => {
      if (prev.includes(storeId)) return prev;
      toast({
        title: "Loja favoritada",
        description: "Loja adicionada aos favoritos!",
      });
      return [...prev, storeId];
    });
  };

  const removeFavoriteStore = (storeId: string) => {
    setFavoriteStores((prev) => {
      toast({
        title: "Removida dos favoritos",
        description: "Loja removida dos favoritos!",
      });
      return prev.filter((id) => id !== storeId);
    });
  };

  const isFavoriteStore = (storeId: string) => favoriteStores.includes(storeId);

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
