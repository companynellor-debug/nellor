import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "@/hooks/use-toast";

interface FavoritesContextType {
  favorites: number[];
  addFavorite: (productId: number) => void;
  removeFavorite: (productId: number) => void;
  isFavorite: (productId: number) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<number[]>(() => {
    const saved = localStorage.getItem("favorites");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (productId: number) => {
    setFavorites((prev) => {
      if (prev.includes(productId)) return prev;
      toast({
        title: "Adicionado aos favoritos",
        description: "Produto adicionado com sucesso!",
      });
      return [...prev, productId];
    });
  };

  const removeFavorite = (productId: number) => {
    setFavorites((prev) => {
      toast({
        title: "Removido dos favoritos",
        description: "Produto removido com sucesso!",
      });
      return prev.filter((id) => id !== productId);
    });
  };

  const isFavorite = (productId: number) => favorites.includes(productId);

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return context;
};
