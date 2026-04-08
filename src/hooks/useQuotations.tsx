import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "@/hooks/use-toast";

export interface QuotationRequest {
  id: string;
  buyer_id: string;
  title: string;
  description: string | null;
  quantity: number;
  unit: string;
  specs_file_url: string | null;
  category_id: string | null;
  deadline: string | null;
  status: "open" | "closed" | "cancelled";
  proposals_count: number;
  created_at: string;
  updated_at: string;
  // joined
  category_name?: string;
  buyer_name?: string;
}

export interface QuotationProposal {
  id: string;
  request_id: string;
  supplier_id: string;
  unit_price: number;
  freight: number;
  offer_validity_days: number;
  notes: string | null;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  updated_at: string;
  // joined
  supplier_name?: string;
  supplier_avatar?: string;
}

// ── Buyer hooks ──

export function useMyQuotations() {
  const { user } = useSupabaseAuth();
  return useQuery({
    queryKey: ["quotations", "mine", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotation_requests" as any)
        .select("*, categories(nome)")
        .eq("buyer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]).map((r) => ({
        ...r,
        category_name: r.categories?.nome ?? null,
      })) as QuotationRequest[];
    },
  });
}

export function useCreateQuotation() {
  const qc = useQueryClient();
  const { user } = useSupabaseAuth();
  return useMutation({
    mutationFn: async (payload: {
      title: string;
      description?: string;
      quantity: number;
      unit?: string;
      category_id?: string;
      deadline?: string;
    }) => {
      const { error } = await supabase.from("quotation_requests" as any).insert({
        buyer_id: user!.id,
        ...payload,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotations"] });
      toast({ title: "Cotação criada com sucesso!" });
    },
    onError: () => toast({ title: "Erro ao criar cotação", variant: "destructive" }),
  });
}

export function useUpdateQuotationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "open" | "closed" | "cancelled" }) => {
      const { error } = await supabase
        .from("quotation_requests" as any)
        .update({ status } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quotations"] }),
  });
}

// ── Proposals for a specific quotation (buyer view) ──

export function useQuotationProposals(requestId: string | undefined) {
  return useQuery({
    queryKey: ["quotation-proposals", requestId],
    enabled: !!requestId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotation_proposals" as any)
        .select("*")
        .eq("request_id", requestId!)
        .order("unit_price", { ascending: true });
      if (error) throw error;

      // fetch supplier names
      const supplierIds = [...new Set((data as any[]).map((p: any) => p.supplier_id))];
      let profiles: any[] = [];
      if (supplierIds.length > 0) {
        const { data: pData } = await supabase.rpc("get_public_store_profiles");
        profiles = (pData as any[]) || [];
      }
      const profileMap = Object.fromEntries(profiles.map((p: any) => [p.id, p]));

      return (data as any[]).map((p: any) => ({
        ...p,
        supplier_name: profileMap[p.supplier_id]?.nome ?? "Fornecedor",
        supplier_avatar: profileMap[p.supplier_id]?.foto_perfil_url ?? null,
      })) as QuotationProposal[];
    },
  });
}

// ── Supplier hooks ──

export function useOpenQuotations(categoryId?: string) {
  return useQuery({
    queryKey: ["quotations", "open", categoryId],
    queryFn: async () => {
      let q = supabase
        .from("quotation_requests" as any)
        .select("*, categories(nome)")
        .eq("status", "open")
        .order("created_at", { ascending: false });
      if (categoryId) q = q.eq("category_id", categoryId);
      const { data, error } = await q;
      if (error) throw error;
      return (data as any[]).map((r) => ({
        ...r,
        category_name: r.categories?.nome ?? null,
      })) as QuotationRequest[];
    },
  });
}

export function useMyProposals() {
  const { user } = useSupabaseAuth();
  return useQuery({
    queryKey: ["quotation-proposals", "mine", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotation_proposals" as any)
        .select("*, quotation_requests(title, quantity, unit, status)")
        .eq("supplier_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useCreateProposal() {
  const qc = useQueryClient();
  const { user } = useSupabaseAuth();
  return useMutation({
    mutationFn: async (payload: {
      request_id: string;
      unit_price: number;
      freight?: number;
      offer_validity_days?: number;
      notes?: string;
    }) => {
      const { error } = await supabase.from("quotation_proposals" as any).insert({
        supplier_id: user!.id,
        ...payload,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotation"] });
      qc.invalidateQueries({ queryKey: ["quotations"] });
      toast({ title: "Proposta enviada com sucesso!" });
    },
    onError: () => toast({ title: "Erro ao enviar proposta", variant: "destructive" }),
  });
}

export function useAcceptProposal() {
  const qc = useQueryClient();
  const { user } = useSupabaseAuth();
  return useMutation({
    mutationFn: async ({ proposalId, requestId, proposal, request }: { 
      proposalId: string; 
      requestId: string;
      proposal: { supplier_id: string; unit_price: number; freight: number; notes?: string | null };
      request: { title: string; quantity: number; unit: string };
    }) => {
      // Accept this proposal
      const { error: e1 } = await supabase
        .from("quotation_proposals" as any)
        .update({ status: "accepted" } as any)
        .eq("id", proposalId);
      if (e1) throw e1;
      // Reject others
      const { error: e2 } = await supabase
        .from("quotation_proposals" as any)
        .update({ status: "rejected" } as any)
        .eq("request_id", requestId)
        .neq("id", proposalId);
      if (e2) throw e2;
      // Close the quotation
      const { error: e3 } = await supabase
        .from("quotation_requests" as any)
        .update({ status: "closed" } as any)
        .eq("id", requestId);
      if (e3) throw e3;
      // Create a negotiation from the accepted proposal
      const totalPrice = proposal.unit_price * request.quantity + (proposal.freight || 0);
      const { data: neg, error: e4 } = await supabase
        .from("negotiations")
        .insert({
          buyer_id: user!.id,
          supplier_id: proposal.supplier_id,
          product_name: `${request.title} (${request.quantity} ${request.unit})`,
          quantity: request.quantity,
          agreed_price: totalPrice,
          notes: proposal.notes ? `Via cotação: ${proposal.notes}` : `Negociação originada de cotação`,
          status: "pending",
        })
        .select("id")
        .single();
      if (e4) throw e4;
      return neg;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotation"] });
      qc.invalidateQueries({ queryKey: ["quotations"] });
      qc.invalidateQueries({ queryKey: ["negotiations"] });
      toast({ title: "Proposta aceita! Negociação criada." });
    },
  });
}
