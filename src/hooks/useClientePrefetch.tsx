import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

// Tipos para os dados prefetchados
interface ClienteData {
  orders: any[];
  addresses: any[];
  paymentMethods: any[];
  notifications: any[];
  profile: any | null;
  supportTickets: any[];
}

interface ClientePrefetchContextType {
  data: ClienteData;
  loading: boolean;
  refetchAll: () => Promise<void>;
  refetchOrders: () => Promise<void>;
  refetchAddresses: () => Promise<void>;
  refetchPaymentMethods: () => Promise<void>;
  refetchNotifications: () => Promise<void>;
  refetchProfile: () => Promise<void>;
}

const defaultData: ClienteData = {
  orders: [],
  addresses: [],
  paymentMethods: [],
  notifications: [],
  profile: null,
  supportTickets: [],
};

const ClientePrefetchContext = createContext<ClientePrefetchContextType | undefined>(undefined);

// Cache global para evitar refetch desnecessário
let globalCache: ClienteData | null = null;
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

export const ClientePrefetchProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<ClienteData>(globalCache || defaultData);
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
      console.log("[cliente-prefetch] auth changed:", event, newUid);
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
      .eq("buyer_id", uid)
      .order("created_at", { ascending: false })
      .limit(100);
    return orders || [];
  }, []);

  const fetchAddresses = useCallback(async (uid: string) => {
    const { data: addresses } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", uid)
      .order("is_default", { ascending: false });
    return addresses || [];
  }, []);

  const fetchPaymentMethods = useCallback(async (uid: string) => {
    const { data: methods } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("user_id", uid)
      .order("is_default", { ascending: false });
    return methods || [];
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

  const fetchSupportTickets = useCallback(async (uid: string) => {
    const { data: tickets } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    return tickets || [];
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
        const [profile, orders, addresses, paymentMethods, notifications, supportTickets] = await Promise.all([
          fetchProfile(uid),
          fetchOrders(uid),
          fetchAddresses(uid),
          fetchPaymentMethods(uid),
          fetchNotifications(uid),
          fetchSupportTickets(uid),
        ]);

        const newData: ClienteData = {
          profile,
          orders,
          addresses,
          paymentMethods,
          notifications,
          supportTickets,
        };

        globalCache = newData;
        lastFetchTime = Date.now();
        setData(newData);
      } catch (error) {
        console.error("Erro ao prefetchar dados do cliente:", error);
      } finally {
        setLoading(false);
      }
    },
    [fetchProfile, fetchOrders, fetchAddresses, fetchPaymentMethods, fetchNotifications, fetchSupportTickets]
  );

  // Funções individuais de refetch (mantidas para telas que precisam forçar refresh)
  const refetchOrders = useCallback(async () => {
    if (!userId) return;
    const orders = await fetchOrders(userId);
    setData((prev) => {
      const newData = { ...prev, orders };
      globalCache = newData;
      return newData;
    });
  }, [userId, fetchOrders]);

  const refetchAddresses = useCallback(async () => {
    if (!userId) return;
    const addresses = await fetchAddresses(userId);
    setData((prev) => {
      const newData = { ...prev, addresses };
      globalCache = newData;
      return newData;
    });
  }, [userId, fetchAddresses]);

  const refetchPaymentMethods = useCallback(async () => {
    if (!userId) return;
    const paymentMethods = await fetchPaymentMethods(userId);
    setData((prev) => {
      const newData = { ...prev, paymentMethods };
      globalCache = newData;
      return newData;
    });
  }, [userId, fetchPaymentMethods]);

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

  const refetchAll = useCallback(async () => {
    if (!userId) return;
    await fetchAllData(userId, true);
  }, [userId, fetchAllData]);

  // Efeito 1: Fetch inicial quando userId muda (login)
  useEffect(() => {
    if (userId) {
      console.log("[cliente-prefetch] userId set, fetching data:", userId);
      fetchAllData(userId, true);
    }
  }, [userId, fetchAllData]);

  // Efeito 2: Realtime - assina quando userId existir, limpa quando mudar/logout
  useEffect(() => {
    // Limpar canais anteriores
    channelsRef.current.forEach((ch) => supabase.removeChannel(ch));
    channelsRef.current = [];

    if (!userId) {
      console.log("[cliente-prefetch] no userId, skipping realtime");
      return;
    }

    console.log("[cliente-prefetch] subscribing realtime for:", userId);

    const ordersChannel = supabase
      .channel(`cliente-orders-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `buyer_id=eq.${userId}` },
        (payload) => {
          const p: any = payload;
          console.log("[realtime] cliente orders", p.eventType, p.new?.id || p.old?.id, "payment_status:", p.new?.payment_status);

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
      .subscribe((status) => console.log("[realtime] cliente orders status:", status));

    const notificationsChannel = supabase
      .channel(`cliente-notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const p: any = payload;
          console.log("[realtime] cliente notifications", p.eventType, p.new?.id || p.old?.id);

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
      .subscribe((status) => console.log("[realtime] cliente notifications status:", status));

    channelsRef.current = [ordersChannel, notificationsChannel];

    return () => {
      channelsRef.current.forEach((ch) => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
  }, [userId]);

  return (
    <ClientePrefetchContext.Provider
      value={{
        data,
        loading,
        refetchAll,
        refetchOrders,
        refetchAddresses,
        refetchPaymentMethods,
        refetchNotifications,
        refetchProfile,
      }}
    >
      {children}
    </ClientePrefetchContext.Provider>
  );
};

export const useClientePrefetch = () => {
  const context = useContext(ClientePrefetchContext);
  if (!context) {
    throw new Error("useClientePrefetch must be used within ClientePrefetchProvider");
  }
  return context;
};

// Hook helper para usar os dados prefetchados diretamente
export const useClienteOrders = () => {
  const { data, loading, refetchOrders } = useClientePrefetch();
  return { orders: data.orders, loading, refetch: refetchOrders };
};

export const useClienteAddresses = () => {
  const { data, loading, refetchAddresses } = useClientePrefetch();
  return { addresses: data.addresses, loading, refetch: refetchAddresses };
};

export const useClientePaymentMethods = () => {
  const { data, loading, refetchPaymentMethods } = useClientePrefetch();
  return { paymentMethods: data.paymentMethods, loading, refetch: refetchPaymentMethods };
};

export const useClienteNotifications = () => {
  const { data, loading, refetchNotifications } = useClientePrefetch();
  return { notifications: data.notifications, loading, refetch: refetchNotifications };
};

export const useClienteProfile = () => {
  const { data, loading, refetchProfile } = useClientePrefetch();
  return { profile: data.profile, loading, refetch: refetchProfile };
};
