import { useEffect, useRef, useState, useCallback } from "react";
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

// ✅ Global cache to prevent redundant fetches when switching tabs
const cache = {
  orders: null as AdminOrder[] | null,
  profiles: null as AdminProfile[] | null,
  stats: null as AdminStats | null,
  lastFetch: 0,
};

const CACHE_TTL = 60_000; // 1 minute cache

function isCacheValid() {
  return Date.now() - cache.lastFetch < CACHE_TTL;
}

export function useAdminData() {
  const [orders, setOrders] = useState<AdminOrder[]>(cache.orders || []);
  const [profiles, setProfiles] = useState<AdminProfile[]>(cache.profiles || []);
  const [stats, setStats] = useState<AdminStats | null>(cache.stats);
  const [loading, setLoading] = useState(!isCacheValid());
  const [error, setError] = useState<string | null>(null);
  const isFetching = useRef(false);

  const fetchData = useCallback(async (force = false) => {
    // Use cache if valid and not forcing refresh
    if (!force && isCacheValid() && cache.orders && cache.profiles && cache.stats) {
      setOrders(cache.orders);
      setProfiles(cache.profiles);
      setStats(cache.stats);
      setLoading(false);
      return;
    }

    // Prevent concurrent fetches
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      setLoading(true);
      setError(null);

      const [ordersRes, profilesRes, statsRes] = await Promise.all([
        supabase.rpc("get_admin_orders"),
        supabase.rpc("get_admin_profiles"),
        supabase.rpc("get_admin_stats"),
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (profilesRes.error) throw profilesRes.error;
      if (statsRes.error) throw statsRes.error;

      const ordersData = (ordersRes.data ?? []) as AdminOrder[];
      const profilesData = (profilesRes.data ?? []) as AdminProfile[];
      const statsData = (statsRes.data?.[0] ?? null) as AdminStats | null;

      // Update cache
      cache.orders = ordersData;
      cache.profiles = profilesData;
      cache.stats = statsData;
      cache.lastFetch = Date.now();

      setOrders(ordersData);
      setProfiles(profilesData);
      setStats(statsData);
    } catch (err: any) {
      console.error("Error fetching admin data:", err);
      setError(err.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  return {
    orders,
    profiles,
    stats,
    loading,
    error,
    refetch,
  };
}
