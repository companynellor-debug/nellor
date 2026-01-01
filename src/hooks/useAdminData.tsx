import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  stripe_account_id: string | null;
};

export type AdminStats = {
  total_users: number;
  active_suppliers: number;
  total_orders: number;
  paid_orders: number;
  delivered_orders: number;
  total_revenue: number;
};

// Cache time otimizado: 5 minutos stale, 10 minutos em cache
const STALE_TIME = 5 * 60 * 1000;
const CACHE_TIME = 10 * 60 * 1000;

export function useAdminData() {
  const queryClient = useQueryClient();

  // Buscar dados em paralelo mas com cache adequado
  const ordersQuery = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_orders");
      if (error) throw error;
      return (data ?? []) as AdminOrder[];
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
  });

  const profilesQuery = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_profiles");
      if (error) throw error;
      return (data ?? []) as AdminProfile[];
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
  });

  const statsQuery = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_stats");
      if (error) throw error;
      return (data?.[0] ?? null) as AdminStats | null;
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
  });

  const loading = ordersQuery.isLoading || profilesQuery.isLoading || statsQuery.isLoading;
  const error = ordersQuery.error || profilesQuery.error || statsQuery.error;

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  return {
    orders: ordersQuery.data || [],
    profiles: profilesQuery.data || [],
    stats: statsQuery.data || null,
    loading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}
