import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "./useSupabaseAuth";

const ALL_METHODS = [
  { value: 'correios_pac', label: 'Correios PAC' },
  { value: 'correios_sedex', label: 'Correios Sedex' },
  { value: 'transportadora_propria', label: 'Transportadora Própria' },
  { value: 'fob', label: 'Frete por conta do comprador (FOB)' },
] as const;

export function useSupplierShippingMethods(supplierId?: string) {
  const { user } = useSupabaseAuth();
  const qc = useQueryClient();
  const targetId = supplierId || user?.id;

  const { data: methods = [], isLoading } = useQuery({
    queryKey: ["supplier-shipping-methods", targetId],
    queryFn: async () => {
      if (!targetId) return [];
      const { data, error } = await supabase
        .from("supplier_shipping_methods" as any)
        .select("*")
        .eq("supplier_id", targetId);
      if (error) { console.error(error); return []; }
      return data as any[];
    },
    enabled: !!targetId,
  });

  const enabledMethods = methods.filter((m: any) => m.enabled).map((m: any) => m.method);

  const toggleMethod = useMutation({
    mutationFn: async ({ method, enabled }: { method: string; enabled: boolean }) => {
      if (!user?.id) throw new Error("Not authenticated");
      if (enabled) {
        const { error } = await supabase
          .from("supplier_shipping_methods" as any)
          .upsert({ supplier_id: user.id, method, enabled: true }, { onConflict: "supplier_id,method" });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("supplier_shipping_methods" as any)
          .update({ enabled: false } as any)
          .eq("supplier_id", user.id)
          .eq("method", method);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["supplier-shipping-methods"] }),
  });

  return { methods, enabledMethods, isLoading, toggleMethod, ALL_METHODS };
}
