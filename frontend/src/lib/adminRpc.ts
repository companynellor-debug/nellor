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

export async function fetchAdminOrders(): Promise<AdminOrder[]> {
  const { data, error } = await supabase.rpc("get_admin_orders");
  if (error) {
    console.error("Error fetching admin orders:", error);
    throw error;
  }
  console.log("Fetched admin orders:", data?.length || 0, "records");
  return (data ?? []) as any;
}

export async function fetchAdminProfiles(): Promise<AdminProfile[]> {
  const { data, error } = await supabase.rpc("get_admin_profiles");
  if (error) {
    console.error("Error fetching admin profiles:", error);
    throw error;
  }
  console.log("Fetched admin profiles:", data?.length || 0, "records");
  return (data ?? []) as any;
}

export async function fetchAdminStats() {
  const { data, error } = await supabase.rpc("get_admin_stats");
  if (error) {
    console.error("Error fetching admin stats:", error);
    throw error;
  }
  console.log("Fetched admin stats:", data);
  return data?.[0] || null;
}
