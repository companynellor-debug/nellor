import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
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
const CACHE_TTL = 30_000; // 30 segundos

export const ClientePrefetchProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<ClienteData>(globalCache || defaultData);
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
      .eq("buyer_id", userId)
      .order("created_at", { ascending: false });
    return orders || [];
  }, []);

  const fetchAddresses = useCallback(async (userId: string) => {
    const { data: addresses } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false });
    return addresses || [];
  }, []);

  const fetchPaymentMethods = useCallback(async (userId: string) => {
    const { data: methods } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false });
    return methods || [];
  }, []);

  const fetchNotifications = useCallback(async (userId: string) => {
    const { data: notifications } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return notifications || [];
  }, []);

  const fetchSupportTickets = useCallback(async (userId: string) => {
    const { data: tickets } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return tickets || [];
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
      const [profile, orders, addresses, paymentMethods, notifications, supportTickets] = await Promise.all([
        fetchProfile(user.id),
        fetchOrders(user.id),
        fetchAddresses(user.id),
        fetchPaymentMethods(user.id),
        fetchNotifications(user.id),
        fetchSupportTickets(user.id),
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
  }, [fetchProfile, fetchOrders, fetchAddresses, fetchPaymentMethods, fetchNotifications, fetchSupportTickets]);

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

  const refetchAddresses = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const addresses = await fetchAddresses(user.id);
    setData(prev => {
      const newData = { ...prev, addresses };
      globalCache = newData;
      return newData;
    });
  }, [fetchAddresses]);

  const refetchPaymentMethods = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const paymentMethods = await fetchPaymentMethods(user.id);
    setData(prev => {
      const newData = { ...prev, paymentMethods };
      globalCache = newData;
      return newData;
    });
  }, [fetchPaymentMethods]);

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
        .channel("cliente-orders-prefetch")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders", filter: `buyer_id=eq.${user.id}` },
          () => refetchOrders()
        )
        .subscribe();
      channels.push(ordersChannel);

      // Realtime para notifications
      const notificationsChannel = supabase
        .channel("cliente-notifications-prefetch")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
          () => refetchNotifications()
        )
        .subscribe();
      channels.push(notificationsChannel);
    };

    setupRealtime();

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [refetchOrders, refetchNotifications]);

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
