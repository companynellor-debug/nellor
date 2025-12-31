import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Tipos para os dados prefetchados do fornecedor
interface FornecedorData {
  orders: any[];
  products: any[];
  notifications: any[];
  profile: any | null;
  coupons: any[];
  transactions: any[];
  payouts: any[];
  analytics: any[];
}

interface FornecedorPrefetchContextType {
  data: FornecedorData;
  loading: boolean;
  refetchAll: () => Promise<void>;
  refetchOrders: () => Promise<void>;
  refetchProducts: () => Promise<void>;
  refetchNotifications: () => Promise<void>;
  refetchProfile: () => Promise<void>;
  refetchCoupons: () => Promise<void>;
  refetchTransactions: () => Promise<void>;
}

const defaultData: FornecedorData = {
  orders: [],
  products: [],
  notifications: [],
  profile: null,
  coupons: [],
  transactions: [],
  payouts: [],
  analytics: [],
};

const FornecedorPrefetchContext = createContext<FornecedorPrefetchContextType | undefined>(undefined);

// Cache global para evitar refetch desnecessário
let globalCache: FornecedorData | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 60_000; // 60 segundos

const sortByCreatedAtDesc = (list: any[]) =>
  list.slice().sort((a, b) => ((a?.created_at || "") < (b?.created_at || "") ? 1 : -1));

const upsertById = (list: any[], next: any) => {
  const idx = list.findIndex((x) => x?.id === next?.id);
  if (idx === -1) return sortByCreatedAtDesc([next, ...list]);
  const copy = list.slice();
  copy[idx] = { ...copy[idx], ...next };
  return sortByCreatedAtDesc(copy);
};

export const FornecedorPrefetchProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<FornecedorData>(globalCache || defaultData);
  const [loading, setLoading] = useState(!globalCache);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
    return profile;
  }, []);

  const fetchOrders = useCallback(async (userId: string) => {
    const { data: orders } = await supabase
      .from("orders")
      .select("*")
      .eq("supplier_id", userId)
      .order("created_at", { ascending: false });
    return orders || [];
  }, []);

  const fetchProducts = useCallback(async (userId: string) => {
    const { data: products } = await supabase
      .from("products")
      .select("*")
      .eq("supplier_id", userId)
      .order("created_at", { ascending: false });
    return products || [];
  }, []);

  const fetchNotifications = useCallback(async (userId: string) => {
    const { data: notifications } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return notifications || [];
  }, []);

  const fetchCoupons = useCallback(async (userId: string) => {
    const { data: coupons } = await supabase
      .from("coupons")
      .select("*")
      .eq("supplier_id", userId)
      .order("created_at", { ascending: false });
    return coupons || [];
  }, []);

  const fetchTransactions = useCallback(async (userId: string) => {
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("supplier_id", userId)
      .order("created_at", { ascending: false });
    return transactions || [];
  }, []);

  const fetchPayouts = useCallback(async (userId: string) => {
    const { data: payouts } = await supabase
      .from("payouts")
      .select("*")
      .eq("supplier_id", userId)
      .order("created_at", { ascending: false });
    return payouts || [];
  }, []);

  const fetchAnalytics = useCallback(async (userId: string) => {
    const { data: analytics } = await supabase
      .from("analytics")
      .select("*")
      .eq("supplier_id", userId)
      .order("mes_referencia", { ascending: false });
    return analytics || [];
  }, []);

  const fetchAllData = useCallback(
    async (force = false) => {
      // Usar cache se ainda válido
      if (!force && globalCache && Date.now() - lastFetchTime < CACHE_TTL) {
        setData(globalCache);
        setLoading(false);
        return;
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setData(defaultData);
          globalCache = null;
          return;
        }

        setLoading(true);

        // Buscar todos os dados em paralelo
        const [profile, orders, products, notifications, coupons, transactions, payouts, analytics] =
          await Promise.all([
            fetchProfile(user.id),
            fetchOrders(user.id),
            fetchProducts(user.id),
            fetchNotifications(user.id),
            fetchCoupons(user.id),
            fetchTransactions(user.id),
            fetchPayouts(user.id),
            fetchAnalytics(user.id),
          ]);

        const newData: FornecedorData = {
          profile,
          orders,
          products,
          notifications,
          coupons,
          transactions,
          payouts,
          analytics,
        };

        globalCache = newData;
        lastFetchTime = Date.now();
        setData(newData);
      } catch (error) {
        console.error("Erro ao prefetchar dados do fornecedor:", error);
      } finally {
        setLoading(false);
      }
    },
    [
      fetchProfile,
      fetchOrders,
      fetchProducts,
      fetchNotifications,
      fetchCoupons,
      fetchTransactions,
      fetchPayouts,
      fetchAnalytics,
    ]
  );

  // Funções individuais de refetch (mantidas para forçar refresh quando necessário)
  const refetchOrders = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const orders = await fetchOrders(user.id);
    setData((prev) => {
      const newData = { ...prev, orders };
      globalCache = newData;
      return newData;
    });
  }, [fetchOrders]);

  const refetchProducts = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const products = await fetchProducts(user.id);
    setData((prev) => {
      const newData = { ...prev, products };
      globalCache = newData;
      return newData;
    });
  }, [fetchProducts]);

  const refetchNotifications = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const notifications = await fetchNotifications(user.id);
    setData((prev) => {
      const newData = { ...prev, notifications };
      globalCache = newData;
      return newData;
    });
  }, [fetchNotifications]);

  const refetchProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const profile = await fetchProfile(user.id);
    setData((prev) => {
      const newData = { ...prev, profile };
      globalCache = newData;
      return newData;
    });
  }, [fetchProfile]);

  const refetchCoupons = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const coupons = await fetchCoupons(user.id);
    setData((prev) => {
      const newData = { ...prev, coupons };
      globalCache = newData;
      return newData;
    });
  }, [fetchCoupons]);

  const refetchTransactions = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const transactions = await fetchTransactions(user.id);
    setData((prev) => {
      const newData = { ...prev, transactions };
      globalCache = newData;
      return newData;
    });
  }, [fetchTransactions]);

  const refetchAll = useCallback(async () => {
    await fetchAllData(true);
  }, [fetchAllData]);

  // Prefetch ao montar (uma vez, layout persistente)
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Realtime (atualiza estado global SEM refetch completo)
  useEffect(() => {
    let ordersChannel: ReturnType<typeof supabase.channel> | null = null;
    let notificationsChannel: ReturnType<typeof supabase.channel> | null = null;
    let productsChannel: ReturnType<typeof supabase.channel> | null = null;
    let transactionsChannel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      console.log("[realtime] subscribing fornecedor orders/notifications/products/transactions", user.id);

      // Orders
      ordersChannel = supabase
        .channel(`fornecedor-orders-${user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders", filter: `supplier_id=eq.${user.id}` },
          (payload) => {
            const p: any = payload;
            console.log("[realtime] fornecedor orders", p.eventType, p.new?.id || p.old?.id);

            if (p.eventType === "DELETE") {
              const oldRow: any = p.old;
              setData((prev) => {
                const orders = prev.orders.filter((o: any) => o?.id !== oldRow?.id);
                const next = { ...prev, orders };
                globalCache = next;
                return next;
              });
              return;
            }

            const newRow: any = p.new;
            setData((prev) => {
              const orders = upsertById(prev.orders, newRow);
              const next = { ...prev, orders };
              globalCache = next;
              return next;
            });
          }
        )
        .subscribe((status) => console.log("[realtime] fornecedor orders status", status));

      // Notifications
      notificationsChannel = supabase
        .channel(`fornecedor-notifications-${user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
          (payload) => {
            const p: any = payload;
            console.log("[realtime] fornecedor notifications", p.eventType, p.new?.id || p.old?.id);

            if (p.eventType === "DELETE") {
              const oldRow: any = p.old;
              setData((prev) => {
                const notifications = prev.notifications.filter((n: any) => n?.id !== oldRow?.id);
                const next = { ...prev, notifications };
                globalCache = next;
                return next;
              });
              return;
            }

            const newRow: any = p.new;
            setData((prev) => {
              const notifications = upsertById(prev.notifications, newRow);
              const next = { ...prev, notifications };
              globalCache = next;
              return next;
            });
          }
        )
        .subscribe((status) => console.log("[realtime] fornecedor notifications status", status));

      // Products
      productsChannel = supabase
        .channel(`fornecedor-products-${user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "products", filter: `supplier_id=eq.${user.id}` },
          (payload) => {
            const p: any = payload;
            console.log("[realtime] fornecedor products", p.eventType, p.new?.id || p.old?.id);

            if (p.eventType === "DELETE") {
              const oldRow: any = p.old;
              setData((prev) => {
                const products = prev.products.filter((x: any) => x?.id !== oldRow?.id);
                const next = { ...prev, products };
                globalCache = next;
                return next;
              });
              return;
            }

            const newRow: any = p.new;
            setData((prev) => {
              const products = upsertById(prev.products, newRow);
              const next = { ...prev, products };
              globalCache = next;
              return next;
            });
          }
        )
        .subscribe((status) => console.log("[realtime] fornecedor products status", status));

      // Transactions
      transactionsChannel = supabase
        .channel(`fornecedor-transactions-${user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "transactions", filter: `supplier_id=eq.${user.id}` },
          (payload) => {
            const p: any = payload;
            console.log("[realtime] fornecedor transactions", p.eventType, p.new?.id || p.old?.id);

            if (p.eventType === "DELETE") {
              const oldRow: any = p.old;
              setData((prev) => {
                const transactions = prev.transactions.filter((x: any) => x?.id !== oldRow?.id);
                const next = { ...prev, transactions };
                globalCache = next;
                return next;
              });
              return;
            }

            const newRow: any = p.new;
            setData((prev) => {
              const transactions = upsertById(prev.transactions, newRow);
              const next = { ...prev, transactions };
              globalCache = next;
              return next;
            });
          }
        )
        .subscribe((status) => console.log("[realtime] fornecedor transactions status", status));
    };

    setupRealtime();

    return () => {
      if (ordersChannel) supabase.removeChannel(ordersChannel);
      if (notificationsChannel) supabase.removeChannel(notificationsChannel);
      if (productsChannel) supabase.removeChannel(productsChannel);
      if (transactionsChannel) supabase.removeChannel(transactionsChannel);
    };
  }, []);

  return (
    <FornecedorPrefetchContext.Provider
      value={{
        data,
        loading,
        refetchAll,
        refetchOrders,
        refetchProducts,
        refetchNotifications,
        refetchProfile,
        refetchCoupons,
        refetchTransactions,
      }}
    >
      {children}
    </FornecedorPrefetchContext.Provider>
  );
};

export const useFornecedorPrefetch = () => {
  const context = useContext(FornecedorPrefetchContext);
  if (!context) {
    throw new Error("useFornecedorPrefetch must be used within FornecedorPrefetchProvider");
  }
  return context;
};

// Hooks helpers para usar os dados prefetchados diretamente
export const useFornecedorOrders = () => {
  const { data, loading, refetchOrders } = useFornecedorPrefetch();
  return { orders: data.orders, loading, refetch: refetchOrders };
};

export const useFornecedorProducts = () => {
  const { data, loading, refetchProducts } = useFornecedorPrefetch();
  return { products: data.products, loading, refetch: refetchProducts };
};

export const useFornecedorNotifications = () => {
  const { data, loading, refetchNotifications } = useFornecedorPrefetch();
  return { notifications: data.notifications, loading, refetch: refetchNotifications };
};

export const useFornecedorProfile = () => {
  const { data, loading, refetchProfile } = useFornecedorPrefetch();
  return { profile: data.profile, loading, refetch: refetchProfile };
};

export const useFornecedorCoupons = () => {
  const { data, loading, refetchCoupons } = useFornecedorPrefetch();
  return { coupons: data.coupons, loading, refetch: refetchCoupons };
};

export const useFornecedorTransactions = () => {
  const { data, loading, refetchTransactions } = useFornecedorPrefetch();
  return { transactions: data.transactions, loading, refetch: refetchTransactions };
};
