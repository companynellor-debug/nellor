import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

type ProductId = string | number;

interface FavoritesContextType {
  favorites: ProductId[];
  addFavorite: (productId: ProductId) => Promise<void> | void;
  removeFavorite: (productId: ProductId) => Promise<void> | void;
  isFavorite: (productId: ProductId) => boolean;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const FAVORITES_COLLECTION_NAME = "Favoritos";
const LOCAL_KEY = "favorites";

const isUuid = (v: ProductId): v is string =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useSupabaseAuth();
  const [favorites, setFavorites] = useState<ProductId[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Persist to localStorage as cache/fallback (always)
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(favorites));
    } catch {
      /* ignore */
    }
  }, [favorites]);

  // Ensure user has a "Favoritos" collection and load remote favorites
  useEffect(() => {
    let cancelled = false;
    if (!isAuthenticated || !user?.id) {
      setCollectionId(null);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        // Try to find existing favorites collection
        let { data: cols } = await supabase
          .from("collections")
          .select("id, name")
          .eq("user_id", user.id)
          .eq("name", FAVORITES_COLLECTION_NAME)
          .limit(1);

        let colId: string | null = cols?.[0]?.id ?? null;

        if (!colId) {
          const { data: created, error: createErr } = await supabase
            .from("collections")
            .insert({ user_id: user.id, name: FAVORITES_COLLECTION_NAME, is_public: false })
            .select("id")
            .single();
          if (createErr) throw createErr;
          colId = created.id;
        }

        if (cancelled || !colId) return;
        setCollectionId(colId);

        // Load all product favorites in this collection
        const { data: items } = await supabase
          .from("collection_items")
          .select("reference_id, type")
          .eq("collection_id", colId)
          .eq("type", "product");

        if (cancelled) return;

        const remoteIds = (items || []).map((i: any) => i.reference_id as string);

        // Merge with localStorage (preserves legacy numeric ids while user is anonymous)
        setFavorites((prev) => {
          const localOnly = prev.filter((id) => !isUuid(id));
          const merged = Array.from(new Set([...remoteIds, ...localOnly]));
          return merged;
        });

        // Sync any local UUIDs to Supabase that weren't already there
        const localUuids = new Set(
          (JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]") as ProductId[]).filter(isUuid)
        );
        const remoteSet = new Set(remoteIds);
        const toUpload = Array.from(localUuids).filter((id) => !remoteSet.has(id as string));
        if (toUpload.length > 0) {
          await supabase.from("collection_items").insert(
            toUpload.map((id) => ({
              collection_id: colId,
              type: "product" as const,
              reference_id: id as string,
            }))
          );
          setFavorites((prev) => Array.from(new Set([...prev, ...toUpload])));
        }
      } catch (err) {
        console.error("[useFavorites] load error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  const addFavorite = useCallback(
    async (productId: ProductId) => {
      setFavorites((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
      toast({ title: "Adicionado aos favoritos", description: "Produto adicionado com sucesso!" });

      if (isUuid(productId) && collectionId) {
        try {
          await supabase
            .from("collection_items")
            .insert({
              collection_id: collectionId,
              type: "product" as const,
              reference_id: productId,
            });
        } catch (err) {
          console.error("[useFavorites] add error:", err);
        }
      }
    },
    [collectionId]
  );

  const removeFavorite = useCallback(
    async (productId: ProductId) => {
      setFavorites((prev) => prev.filter((id) => id !== productId));
      toast({ title: "Removido dos favoritos", description: "Produto removido com sucesso!" });

      if (isUuid(productId) && collectionId) {
        try {
          await supabase
            .from("collection_items")
            .delete()
            .eq("collection_id", collectionId)
            .eq("type", "product")
            .eq("reference_id", productId);
        } catch (err) {
          console.error("[useFavorites] remove error:", err);
        }
      }
    },
    [collectionId]
  );

  const isFavorite = useCallback(
    (productId: ProductId) => favorites.includes(productId),
    [favorites]
  );

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite, loading }}>
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
