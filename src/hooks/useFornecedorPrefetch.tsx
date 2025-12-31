import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
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
  refetchPayouts: () => Promise<void>;
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
  const [userId, setUserId] = useState<string | null>(null);
  const channelsRef = useRef<ReturnType<typeof supabase.channel>[]>([]);

  // Listener de auth: atualiza userId quando sessão muda
  useEffect(() => {
    // Primeiro, pegar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });

    // Depois, escutar mudanças
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const newUid = session?.user?.id ?? null;
      console.log("[fornecedor-prefetch] auth changed:", event, newUid);
      setUserId(newUid);

      // Limpar cache no logout
      if (!newUid) {
        globalCache = null;
        setData(defaultData);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = useCallback(async (uid: string) => {
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", uid).single();
    return profile;
  }, []);

  const fetchOrders = useCallback(async (uid: string) => {
    const { data: orders } = await supabase
      .from("orders")
      .select("*")
      .eq("supplier_id", uid)
      .order("created_at", { ascending: false })
      .limit(100);
    return orders || [];
  }, []);

  const fetchProducts = useCallback(async (uid: string) => {
    const { data: products } = await supabase
      .from("products")
      .select("*")
      .eq("supplier_id", uid)
      .order("created_at", { ascending: false });
    return products || [];
  }, []);

  const fetchNotifications = useCallback(async (uid: string) => {
    const { data: notifications } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(50);
    return notifications || [];
  }, []);

  const fetchCoupons = useCallback(async (uid: string) => {
    const { data: coupons } = await supabase
      .from("coupons")
      .select("*")
      .eq("supplier_id", uid)
      .order("created_at", { ascending: false });
    return coupons || [];
  }, []);

  const fetchTransactions = useCallback(async (uid: string) => {
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("supplier_id", uid)
      .order("created_at", { ascending: false })
      .limit(100);
    return transactions || [];
  }, []);

  const fetchPayouts = useCallback(async (uid: string) => {
    const { data: payouts } = await supabase
      .from("payouts")
      .select("*")
      .eq("supplier_id", uid)
      .order("created_at", { ascending: false });
    return payouts || [];
  }, []);

  const fetchAnalytics = useCallback(async (uid: string) => {
    const { data: analytics } = await supabase
      .from("analytics")
      .select("*")
      .eq("supplier_id", uid)
      .order("mes_referencia", { ascending: false });
    return analytics || [];
  }, []);

  const fetchAllData = useCallback(
    async (uid: string, force = false) => {
      // Usar cache se ainda válido
      if (!force && globalCache && Date.now() - lastFetchTime < CACHE_TTL) {
        setData(globalCache);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Buscar todos os dados em paralelo
        const [profile, orders, products, notifications, coupons, transactions, payouts, analytics] =
          await Promise.all([
            fetchProfile(uid),
            fetchOrders(uid),
            fetchProducts(uid),
            fetchNotifications(uid),
            fetchCoupons(uid),
            fetchTransactions(uid),
            fetchPayouts(uid),
            fetchAnalytics(uid),
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
    if (!userId) return;
    const orders = await fetchOrders(userId);
    setData((prev) => {
      const newData = { ...prev, orders };
      globalCache = newData;
      return newData;
    });
  }, [userId, fetchOrders]);

  const refetchProducts = useCallback(async () => {
    if (!userId) return;
    const products = await fetchProducts(userId);
    setData((prev) => {
      const newData = { ...prev, products };
      globalCache = newData;
      return newData;
    });
  }, [userId, fetchProducts]);

  const refetchNotifications = useCallback(async () => {
    if (!userId) return;
    const notifications = await fetchNotifications(userId);
    setData((prev) => {
      const newData = { ...prev, notifications };
      globalCache = newData;
      return newData;
    });
  }, [userId, fetchNotifications]);

  const refetchProfile = useCallback(async () => {
    if (!userId) return;
    const profile = await fetchProfile(userId);
    setData((prev) => {
      const newData = { ...prev, profile };
      globalCache = newData;
      return newData;
    });
  }, [userId, fetchProfile]);

  const refetchCoupons = useCallback(async () => {
    if (!userId) return;
    const coupons = await fetchCoupons(userId);
    setData((prev) => {
      const newData = { ...prev, coupons };
      globalCache = newData;
      return newData;
    });
  }, [userId, fetchCoupons]);

  const refetchTransactions = useCallback(async () => {
    if (!userId) return;
    const transactions = await fetchTransactions(userId);
    setData((prev) => {
      const newData = { ...prev, transactions };
      globalCache = newData;
      return newData;
    });
  }, [userId, fetchTransactions]);

  const refetchPayouts = useCallback(async () => {
    if (!userId) return;
    const payouts = await fetchPayouts(userId);
    setData((prev) => {
      const newData = { ...prev, payouts };
      globalCache = newData;
      return newData;
    });
  }, [userId, fetchPayouts]);

  const refetchAll = useCallback(async () => {
    if (!userId) return;
    await fetchAllData(userId, true);
  }, [userId, fetchAllData]);

  // Efeito 1: Fetch inicial quando userId muda (login)
  useEffect(() => {
    if (userId) {
      console.log("[fornecedor-prefetch] userId set, fetching data:", userId);
      fetchAllData(userId, true);
    }
  }, [userId, fetchAllData]);

  // Efeito 2: Realtime - assina quando userId existir, limpa quando mudar/logout
  useEffect(() => {
    // Limpar canais anteriores
    channelsRef.current.forEach((ch) => supabase.removeChannel(ch));
    channelsRef.current = [];

    if (!userId) {
      console.log("[fornecedor-prefetch] no userId, skipping realtime");
      return;
    }

    console.log("[fornecedor-prefetch] subscribing realtime for:", userId);

    // Orders
    const ordersChannel = supabase
      .channel(`fornecedor-orders-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `supplier_id=eq.${userId}` },
        (payload) => {
          const p: any = payload;
          console.log("[realtime] fornecedor orders", p.eventType, p.new?.id || p.old?.id, "payment_status:", p.new?.payment_status);

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
      .subscribe((status) => console.log("[realtime] fornecedor orders status:", status));

    // Notifications
    const notificationsChannel = supabase
      .channel(`fornecedor-notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
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
      .subscribe((status) => console.log("[realtime] fornecedor notifications status:", status));

    // Products
    const productsChannel = supabase
      .channel(`fornecedor-products-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products", filter: `supplier_id=eq.${userId}` },
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
      .subscribe((status) => console.log("[realtime] fornecedor products status:", status));

    // Transactions
    const transactionsChannel = supabase
      .channel(`fornecedor-transactions-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions", filter: `supplier_id=eq.${userId}` },
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
      .subscribe((status) => console.log("[realtime] fornecedor transactions status:", status));

    // Payouts
    const payoutsChannel = supabase
      .channel(`fornecedor-payouts-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payouts", filter: `supplier_id=eq.${userId}` },
        (payload) => {
          const p: any = payload;
          console.log("[realtime] fornecedor payouts", p.eventType, p.new?.id || p.old?.id);

          if (p.eventType === "DELETE") {
            const oldRow: any = p.old;
            setData((prev) => {
              const payouts = prev.payouts.filter((x: any) => x?.id !== oldRow?.id);
              const next = { ...prev, payouts };
              globalCache = next;
              return next;
            });
            return;
          }

          const newRow: any = p.new;
          setData((prev) => {
            const payouts = upsertById(prev.payouts, newRow);
            const next = { ...prev, payouts };
            globalCache = next;
            return next;
          });
        }
      )
      .subscribe((status) => console.log("[realtime] fornecedor payouts status:", status));

    channelsRef.current = [ordersChannel, notificationsChannel, productsChannel, transactionsChannel, payoutsChannel];

    return () => {
      channelsRef.current.forEach((ch) => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
  }, [userId]);

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
        refetchPayouts,
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

export const useFornecedorPayouts = () => {
  const { data, loading, refetchPayouts } = useFornecedorPrefetch();
  return { payouts: data.payouts, loading, refetch: refetchPayouts };
};
