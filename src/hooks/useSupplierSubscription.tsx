import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "./useSupabaseAuth";

interface SubscriptionData {
  id: string;
  status: string;
  plan_name: string;
  price: number;
  started_at: string | null;
  expires_at: string | null;
  days_remaining: number | null;
}

export function useSupplierSubscription() {
  const { user } = useSupabaseAuth();
  const queryClient = useQueryClient();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["supplier-subscription", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase.rpc("get_supplier_subscription", {
        _supplier_id: user.id,
      });
      if (error) throw error;
      return (data?.[0] as SubscriptionData) || null;
    },
    enabled: !!user?.id,
  });

  const createSubscription = useMutation({
    mutationFn: async (paymentMethod: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase.from("supplier_subscriptions" as any).insert({
        supplier_id: user.id,
        status: "pending",
        plan_name: "Mensal",
        price: 29,
        payment_method: paymentMethod,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-subscription"] });
    },
  });

  const isActive = subscription?.status === "active";
  const isPending = subscription?.status === "pending";
  const isExpired = subscription?.status === "expired";
  const needsSubscription = !subscription || isExpired;
  const daysRemaining = subscription?.days_remaining ?? null;

  return {
    subscription,
    isLoading,
    isActive,
    isPending,
    isExpired,
    needsSubscription,
    daysRemaining,
    createSubscription,
  };
}
