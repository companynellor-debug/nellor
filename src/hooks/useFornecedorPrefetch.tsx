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
const CACHE_TTL = 30_000; // 30 segundos

export const FornecedorPrefetchProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<FornecedorData>(globalCache || defaultData);
  const [loading, setLoading] = useState(!globalCache);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
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

  const fetchAllData = useCallback(async (force = false) => {
    // Usar cache se ainda válido
    if (!force && globalCache && Date.now() - lastFetchTime < CACHE_TTL) {
      setData(globalCache);
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setData(defaultData);
        globalCache = null;
        return;
      }

      setLoading(true);

      // Buscar todos os dados em paralelo
      const [profile, orders, products, notifications, coupons, transactions, payouts, analytics] = await Promise.all([
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
  }, [fetchProfile, fetchOrders, fetchProducts, fetchNotifications, fetchCoupons, fetchTransactions, fetchPayouts, fetchAnalytics]);

  // Funções individuais de refetch
  const refetchOrders = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const orders = await fetchOrders(user.id);
    setData(prev => {
      const newData = { ...prev, orders };
      globalCache = newData;
      return newData;
    });
  }, [fetchOrders]);

  const refetchProducts = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const products = await fetchProducts(user.id);
    setData(prev => {
      const newData = { ...prev, products };
      globalCache = newData;
      return newData;
    });
  }, [fetchProducts]);

  const refetchNotifications = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const notifications = await fetchNotifications(user.id);
    setData(prev => {
      const newData = { ...prev, notifications };
      globalCache = newData;
      return newData;
    });
  }, [fetchNotifications]);

  const refetchProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const profile = await fetchProfile(user.id);
    setData(prev => {
      const newData = { ...prev, profile };
      globalCache = newData;
      return newData;
    });
  }, [fetchProfile]);

  const refetchCoupons = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const coupons = await fetchCoupons(user.id);
    setData(prev => {
      const newData = { ...prev, coupons };
      globalCache = newData;
      return newData;
    });
  }, [fetchCoupons]);

  const refetchTransactions = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const transactions = await fetchTransactions(user.id);
    setData(prev => {
      const newData = { ...prev, transactions };
      globalCache = newData;
      return newData;
    });
  }, [fetchTransactions]);

  const refetchAll = useCallback(async () => {
    await fetchAllData(true);
  }, [fetchAllData]);

  // Prefetch ao montar
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Configurar realtime para atualizações automáticas
  useEffect(() => {
    let channels: ReturnType<typeof supabase.channel>[] = [];

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Realtime para orders
      const ordersChannel = supabase
        .channel("fornecedor-orders-prefetch")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders", filter: `supplier_id=eq.${user.id}` },
          () => refetchOrders()
        )
        .subscribe();
      channels.push(ordersChannel);

      // Realtime para notifications
      const notificationsChannel = supabase
        .channel("fornecedor-notifications-prefetch")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
          () => refetchNotifications()
        )
        .subscribe();
      channels.push(notificationsChannel);

      // Realtime para products
      const productsChannel = supabase
        .channel("fornecedor-products-prefetch")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "products", filter: `supplier_id=eq.${user.id}` },
          () => refetchProducts()
        )
        .subscribe();
      channels.push(productsChannel);
    };

    setupRealtime();

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [refetchOrders, refetchNotifications, refetchProducts]);

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
