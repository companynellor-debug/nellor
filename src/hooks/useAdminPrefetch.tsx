import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useCallback } from "react";

const QUERY_TIMEOUT_MS = 8000;

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs = QUERY_TIMEOUT_MS): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Tempo limite excedido ao carregar dados.")), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

// Tipos para os dados do admin
export type AdminOrder = {
  id: string;
  order_number: string;
  buyer_id: string | null;
  supplier_id: string;
  total: number;
  subtotal: number;
  frete: number;
  desconto: number;
  payment_status: string | null;
  order_status: string | null;
  payment_method: string;
  tracking_code: string | null;
  created_at: string;
  updated_at: string | null;
  endereco_entrega: any;
  itens: any;
  proof_url: string | null;
  supplier_name: string | null;
  buyer_name: string | null;
};

export type AdminProfile = {
  id: string;
  nome: string;
  email: string;
  tipo: string;
  telefone: string | null;
  ativo: boolean;
  created_at: string;
  onboarding_completed: boolean;
};

export type AdminStats = {
  total_users: number;
  active_suppliers: number;
  total_orders: number;
  paid_orders: number;
  delivered_orders: number;
  total_revenue: number;
};

// Configuração otimizada: cache longo, sem refetch automático
const STALE_TIME = 10 * 60 * 1000; // 10 minutos
const CACHE_TIME = 15 * 60 * 1000; // 15 minutos

const queryConfig = {
  staleTime: STALE_TIME,
  gcTime: CACHE_TIME,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  retry: 1,
};

// Hook otimizado para orders - só busca quando usado
export const useAdminOrders = () => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await withTimeout(supabase.rpc("get_admin_orders"));
      if (error) throw error;
      return (data ?? []) as AdminOrder[];
    },
    ...queryConfig,
    refetchOnMount: "always" as const,
  });

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
  }, [queryClient]);

  return useMemo(() => ({
    orders: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch,
  }), [query.data, query.isLoading, query.error, refetch]);
};

// Hook otimizado para profiles
export const useAdminProfiles = () => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await withTimeout(supabase.rpc("get_admin_profiles"));
      if (error) throw error;
      return (data ?? []) as AdminProfile[];
    },
    ...queryConfig,
    refetchOnMount: "always" as const,
  });

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
  }, [queryClient]);

  return useMemo(() => ({
    profiles: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch,
  }), [query.data, query.isLoading, query.error, refetch]);
};

// Hook otimizado para stats
export const useAdminStats = () => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data, error } = await withTimeout(supabase.rpc("get_admin_stats"));
      if (error) throw error;
      return (data?.[0] ?? null) as AdminStats | null;
    },
    ...queryConfig,
    refetchOnMount: "always" as const,
  });

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
  }, [queryClient]);

  return useMemo(() => ({
    stats: query.data ?? null,
    loading: query.isLoading,
    error: query.error,
    refetch,
  }), [query.data, query.isLoading, query.error, refetch]);
};

// Hook otimizado para support tickets
export const useAdminSupportTickets = () => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ["admin-support-tickets"],
    queryFn: async () => {
      const { data, error } = await withTimeout(supabase.rpc("get_admin_support_tickets"));
      if (error) throw error;
      return data ?? [];
    },
    ...queryConfig,
    refetchOnMount: "always" as const,
  });

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
  }, [queryClient]);

  return useMemo(() => ({
    supportTickets: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch,
  }), [query.data, query.isLoading, query.error, refetch]);
};

// Hook otimizado para banners
export const useAdminBanners = () => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data } = await supabase
        .from("banners")
        .select("*")
        .order("order_index", { ascending: true });
      return data ?? [];
    },
    ...queryConfig,
    refetchOnMount: "always" as const,
  });

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
  }, [queryClient]);

  return useMemo(() => ({
    banners: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch,
  }), [query.data, query.isLoading, query.error, refetch]);
};

// Hook otimizado para categories
export const useAdminCategories = () => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("nome", { ascending: true });
      return data ?? [];
    },
    ...queryConfig,
    refetchOnMount: "always" as const,
  });

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
  }, [queryClient]);

  return useMemo(() => ({
    categories: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch,
  }), [query.data, query.isLoading, query.error, refetch]);
};

// Hook para invalidar todos os caches admin de uma vez
export const useAdminCacheInvalidation = () => {
  const queryClient = useQueryClient();

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
    queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
    queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
  }, [queryClient]);

  return { invalidateAll };
};
