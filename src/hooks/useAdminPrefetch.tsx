import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Tipos para os dados prefetchados do admin
interface AdminData {
  orders: any[];
  profiles: any[];
  stats: any | null;
  supportTickets: any[];
  payouts: any[];
  banners: any[];
  categories: any[];
}

interface AdminPrefetchContextType {
  data: AdminData;
  loading: boolean;
  refetchAll: () => Promise<void>;
  refetchOrders: () => Promise<void>;
  refetchProfiles: () => Promise<void>;
  refetchStats: () => Promise<void>;
  refetchSupportTickets: () => Promise<void>;
  refetchPayouts: () => Promise<void>;
}

const defaultData: AdminData = {
  orders: [],
  profiles: [],
  stats: null,
  supportTickets: [],
  payouts: [],
  banners: [],
  categories: [],
};

const AdminPrefetchContext = createContext<AdminPrefetchContextType | undefined>(undefined);

// Cache global para evitar refetch desnecessário
let globalCache: AdminData | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 60_000; // 1 minuto para admin

export const AdminPrefetchProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<AdminData>(globalCache || defaultData);
  const [loading, setLoading] = useState(!globalCache);

  const fetchOrders = useCallback(async () => {
    const { data: orders, error } = await supabase.rpc("get_admin_orders");
    if (error) throw error;
    return orders || [];
  }, []);

  const fetchProfiles = useCallback(async () => {
    const { data: profiles, error } = await supabase.rpc("get_admin_profiles");
    if (error) throw error;
    return profiles || [];
  }, []);

  const fetchStats = useCallback(async () => {
    const { data: stats, error } = await supabase.rpc("get_admin_stats");
    if (error) throw error;
    return stats?.[0] || null;
  }, []);

  const fetchSupportTickets = useCallback(async () => {
    const { data: tickets, error } = await supabase.rpc("get_admin_support_tickets");
    if (error) throw error;
    return tickets || [];
  }, []);

  const fetchPayouts = useCallback(async () => {
    const { data: payouts } = await supabase
      .from("payouts")
      .select("*")
      .order("created_at", { ascending: false });
    return payouts || [];
  }, []);

  const fetchBanners = useCallback(async () => {
    const { data: banners } = await supabase
      .from("banners")
      .select("*")
      .order("order_index", { ascending: true });
    return banners || [];
  }, []);

  const fetchCategories = useCallback(async () => {
    const { data: categories } = await supabase
      .from("categories")
      .select("*")
      .order("nome", { ascending: true });
    return categories || [];
  }, []);

  const fetchAllData = useCallback(async (force = false) => {
    // Usar cache se ainda válido
    if (!force && globalCache && Date.now() - lastFetchTime < CACHE_TTL) {
      setData(globalCache);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Buscar todos os dados em paralelo
      const [orders, profiles, stats, supportTickets, payouts, banners, categories] = await Promise.all([
        fetchOrders(),
        fetchProfiles(),
        fetchStats(),
        fetchSupportTickets(),
        fetchPayouts(),
        fetchBanners(),
        fetchCategories(),
      ]);

      const newData: AdminData = {
        orders,
        profiles,
        stats,
        supportTickets,
        payouts,
        banners,
        categories,
      };

      globalCache = newData;
      lastFetchTime = Date.now();
      setData(newData);
    } catch (error) {
      console.error("Erro ao prefetchar dados do admin:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchOrders, fetchProfiles, fetchStats, fetchSupportTickets, fetchPayouts, fetchBanners, fetchCategories]);

  // Funções individuais de refetch
  const refetchOrders = useCallback(async () => {
    const orders = await fetchOrders();
    setData(prev => {
      const newData = { ...prev, orders };
      globalCache = newData;
      return newData;
    });
  }, [fetchOrders]);

  const refetchProfiles = useCallback(async () => {
    const profiles = await fetchProfiles();
    setData(prev => {
      const newData = { ...prev, profiles };
      globalCache = newData;
      return newData;
    });
  }, [fetchProfiles]);

  const refetchStats = useCallback(async () => {
    const stats = await fetchStats();
    setData(prev => {
      const newData = { ...prev, stats };
      globalCache = newData;
      return newData;
    });
  }, [fetchStats]);

  const refetchSupportTickets = useCallback(async () => {
    const supportTickets = await fetchSupportTickets();
    setData(prev => {
      const newData = { ...prev, supportTickets };
      globalCache = newData;
      return newData;
    });
  }, [fetchSupportTickets]);

  const refetchPayouts = useCallback(async () => {
    const payouts = await fetchPayouts();
    setData(prev => {
      const newData = { ...prev, payouts };
      globalCache = newData;
      return newData;
    });
  }, [fetchPayouts]);

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
      // Realtime para orders
      const ordersChannel = supabase
        .channel("admin-orders-prefetch")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders" },
          () => refetchOrders()
        )
        .subscribe();
      channels.push(ordersChannel);

      // Realtime para payouts
      const payoutsChannel = supabase
        .channel("admin-payouts-prefetch")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "payouts" },
          () => refetchPayouts()
        )
        .subscribe();
      channels.push(payoutsChannel);

      // Realtime para support tickets
      const ticketsChannel = supabase
        .channel("admin-tickets-prefetch")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "support_tickets" },
          () => refetchSupportTickets()
        )
        .subscribe();
      channels.push(ticketsChannel);
    };

    setupRealtime();

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [refetchOrders, refetchPayouts, refetchSupportTickets]);

  return (
    <AdminPrefetchContext.Provider
      value={{
        data,
        loading,
        refetchAll,
        refetchOrders,
        refetchProfiles,
        refetchStats,
        refetchSupportTickets,
        refetchPayouts,
      }}
    >
      {children}
    </AdminPrefetchContext.Provider>
  );
};

export const useAdminPrefetch = () => {
  const context = useContext(AdminPrefetchContext);
  if (!context) {
    throw new Error("useAdminPrefetch must be used within AdminPrefetchProvider");
  }
  return context;
};

// Hooks helpers para usar os dados prefetchados diretamente
export const useAdminOrders = () => {
  const { data, loading, refetchOrders } = useAdminPrefetch();
  return { orders: data.orders, loading, refetch: refetchOrders };
};

export const useAdminProfiles = () => {
  const { data, loading, refetchProfiles } = useAdminPrefetch();
  return { profiles: data.profiles, loading, refetch: refetchProfiles };
};

export const useAdminStats = () => {
  const { data, loading, refetchStats } = useAdminPrefetch();
  return { stats: data.stats, loading, refetch: refetchStats };
};

export const useAdminSupportTickets = () => {
  const { data, loading, refetchSupportTickets } = useAdminPrefetch();
  return { supportTickets: data.supportTickets, loading, refetch: refetchSupportTickets };
};

export const useAdminPayouts = () => {
  const { data, loading, refetchPayouts } = useAdminPrefetch();
  return { payouts: data.payouts, loading, refetch: refetchPayouts };
};
