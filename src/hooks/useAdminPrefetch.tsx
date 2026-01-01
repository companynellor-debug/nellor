import { createContext, useContext, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Tipos para os dados do admin
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
  refetchAll: () => void;
  refetchOrders: () => void;
  refetchProfiles: () => void;
  refetchStats: () => void;
  refetchSupportTickets: () => void;
  refetchPayouts: () => void;
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

// Configuração otimizada: cache longo, sem refetch automático agressivo
const STALE_TIME = 5 * 60 * 1000; // 5 minutos
const CACHE_TIME = 10 * 60 * 1000; // 10 minutos

export const AdminPrefetchProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  // Cada query individual com lazy loading - só busca quando necessário
  const ordersQuery = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_orders");
      if (error) throw error;
      return data || [];
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: false, // Lazy - só busca quando chamado
  });

  const profilesQuery = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_profiles");
      if (error) throw error;
      return data || [];
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: false,
  });

  const statsQuery = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_stats");
      if (error) throw error;
      return data?.[0] || null;
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: false,
  });

  const supportTicketsQuery = useQuery({
    queryKey: ["admin-support-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_support_tickets");
      if (error) throw error;
      return data || [];
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: false,
  });

  const payoutsQuery = useQuery({
    queryKey: ["admin-payouts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("payouts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: false,
  });

  const bannersQuery = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data } = await supabase
        .from("banners")
        .select("*")
        .order("order_index", { ascending: true });
      return data || [];
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: false,
  });

  const categoriesQuery = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("nome", { ascending: true });
      return data || [];
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: false,
  });

  const data: AdminData = {
    orders: ordersQuery.data || [],
    profiles: profilesQuery.data || [],
    stats: statsQuery.data || null,
    supportTickets: supportTicketsQuery.data || [],
    payouts: payoutsQuery.data || [],
    banners: bannersQuery.data || [],
    categories: categoriesQuery.data || [],
  };

  const loading = ordersQuery.isLoading || profilesQuery.isLoading || statsQuery.isLoading;

  const refetchAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
    queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
  };

  const refetchOrders = () => queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
  const refetchProfiles = () => queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
  const refetchStats = () => queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
  const refetchSupportTickets = () => queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
  const refetchPayouts = () => queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });

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

// Hooks individuais para cada página - só busca quando o hook é usado
export const useAdminOrders = () => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_orders");
      if (error) throw error;
      return data || [];
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
  });

  return {
    orders: query.data || [],
    loading: query.isLoading,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
  };
};

export const useAdminProfiles = () => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_profiles");
      if (error) throw error;
      return data || [];
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
  });

  return {
    profiles: query.data || [],
    loading: query.isLoading,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["admin-profiles"] }),
  };
};

export const useAdminStats = () => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_stats");
      if (error) throw error;
      return data?.[0] || null;
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
  });

  return {
    stats: query.data || null,
    loading: query.isLoading,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["admin-stats"] }),
  };
};

export const useAdminSupportTickets = () => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ["admin-support-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_support_tickets");
      if (error) throw error;
      return data || [];
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
  });

  return {
    supportTickets: query.data || [],
    loading: query.isLoading,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] }),
  };
};

export const useAdminPayouts = () => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ["admin-payouts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("payouts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
  });

  return {
    payouts: query.data || [],
    loading: query.isLoading,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["admin-payouts"] }),
  };
};
