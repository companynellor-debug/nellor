import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DropAdminStats {
  total_gmv: number;
  total_client_margin: number;
  total_platform_fees: number;
  pending_commissions: number;
  active_drop_clients: number;
  active_drop_suppliers: number;
  total_drop_orders: number;
  paid_drop_orders: number;
}

interface DropSupplierAdmin {
  supplier_id: string;
  supplier_name: string;
  drop_enabled: boolean;
  products_in_drop: number;
  total_sales: number;
  total_orders: number;
}

interface DropClientAdmin {
  client_id: string;
  client_name: string;
  business_name: string | null;
  drop_enabled: boolean;
  products_count: number;
  total_revenue: number;
  total_margin: number;
  total_orders: number;
  created_at: string;
}

interface DropAuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}

export function useAdminDrop() {
  // Fetch admin drop stats
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['admin-drop-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_drop_admin_stats');
      
      if (error) throw error;
      return (data?.[0] || {
        total_gmv: 0,
        total_client_margin: 0,
        total_platform_fees: 0,
        pending_commissions: 0,
        active_drop_clients: 0,
        active_drop_suppliers: 0,
        total_drop_orders: 0,
        paid_drop_orders: 0,
      }) as DropAdminStats;
    },
  });

  // Fetch suppliers in drop
  const { data: suppliers, isLoading: loadingSuppliers } = useQuery({
    queryKey: ['admin-drop-suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_drop_suppliers_admin');
      
      if (error) throw error;
      return (data || []) as DropSupplierAdmin[];
    },
  });

  // Fetch clients in drop
  const { data: clients, isLoading: loadingClients } = useQuery({
    queryKey: ['admin-drop-clients'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_drop_clients_admin');
      
      if (error) throw error;
      return (data || []) as DropClientAdmin[];
    },
  });

  // Fetch all drop orders for admin
  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ['admin-drop-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drop_orders')
        .select(`
          *,
          product:products(nome, imagens)
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch audit logs
  const { data: auditLogs, isLoading: loadingAudit } = useQuery({
    queryKey: ['admin-drop-audit'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drop_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return (data || []) as DropAuditLog[];
    },
  });

  return {
    stats,
    suppliers,
    clients,
    orders,
    auditLogs,
    isLoading: loadingStats || loadingSuppliers || loadingClients || loadingOrders || loadingAudit,
  };
}
