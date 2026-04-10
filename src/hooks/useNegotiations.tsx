import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Negotiation {
  id: string;
  buyer_id: string;
  supplier_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  agreed_price: number;
  payment_method: string;
  expected_delivery: string | null;
  status: 'pending' | 'accepted' | 'shipped' | 'delivered' | 'disputed' | 'cancelled';
  buyer_confirmed_delivery: boolean;
  delivery_confirmed_at: string | null;
  supplier_confirmed_shipping: boolean;
  shipping_confirmed_at: string | null;
  delivery_check_sent: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Payment security fields
  payment_state: 'not_reported' | 'reported_by_buyer' | 'confirmed_by_supplier' | 'contested_by_supplier';
  payment_reported_at: string | null;
  payment_proof_url: string | null;
  payment_reference: string | null;
  payment_confirmed_at: string | null;
  payment_contested_reason: string | null;
  // NF & form fields
  buyer_data: Record<string, any> | null;
  sale_unit: string | null;
  unit_price: number | null;
  invoice_url: string | null;
}

// Minimum time intervals (in ms) for anti-fraud
const MIN_INTERVALS = {
  pending_to_accepted: 60 * 60 * 1000,
  accepted_to_shipped: 24 * 60 * 60 * 1000,
  shipped_to_delivered: 48 * 60 * 60 * 1000,
};

export function getTimeUntilAllowed(neg: Negotiation): { allowed: boolean; remainingMs: number; label: string } {
  const now = Date.now();

  if (neg.status === 'pending') {
    const since = new Date(neg.created_at).getTime();
    const remaining = (since + MIN_INTERVALS.pending_to_accepted) - now;
    return { allowed: remaining <= 0, remainingMs: Math.max(0, remaining), label: 'aceitar' };
  }

  if (neg.status === 'accepted') {
    const since = new Date(neg.updated_at).getTime();
    const remaining = (since + MIN_INTERVALS.accepted_to_shipped) - now;
    return { allowed: remaining <= 0, remainingMs: Math.max(0, remaining), label: 'marcar envio' };
  }

  if (neg.status === 'shipped') {
    const since = neg.shipping_confirmed_at ? new Date(neg.shipping_confirmed_at).getTime() : new Date(neg.updated_at).getTime();
    const remaining = (since + MIN_INTERVALS.shipped_to_delivered) - now;
    return { allowed: remaining <= 0, remainingMs: Math.max(0, remaining), label: 'confirmar entrega' };
  }

  return { allowed: true, remainingMs: 0, label: '' };
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return '';
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const mins = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (hours > 0) return `${hours}h ${mins}min`;
  return `${mins}min`;
}

export const useNegotiations = (filterSupplierId?: string) => {
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchNegotiations = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('negotiations')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterSupplierId) {
        query = query.eq('supplier_id', filterSupplierId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNegotiations((data || []) as unknown as Negotiation[]);
    } catch (error: any) {
      console.error('Error fetching negotiations:', error);
    } finally {
      setLoading(false);
    }
  }, [filterSupplierId]);

  useEffect(() => {
    fetchNegotiations();
  }, [fetchNegotiations]);

  const createNegotiation = async (data: {
    supplier_id: string;
    product_id?: string;
    product_name: string;
    quantity: number;
    agreed_price: number;
    payment_method: string;
    expected_delivery?: string;
    notes?: string;
    buyer_data?: Record<string, any>;
    sale_unit?: string;
    unit_price?: number;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const insertData = {
        buyer_id: user.id,
        supplier_id: data.supplier_id,
        product_id: data.product_id || null,
        product_name: data.product_name,
        quantity: data.quantity,
        agreed_price: data.agreed_price,
        payment_method: data.payment_method,
        expected_delivery: data.expected_delivery || null,
        notes: data.notes || null,
        buyer_data: data.buyer_data || null,
        sale_unit: data.sale_unit || null,
        unit_price: data.unit_price || null,
      };

      const { data: result, error } = await supabase
        .from('negotiations')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Negociação registrada!', description: 'O registro da negociação foi criado com sucesso.' });
      await fetchNegotiations();
      return result;
    } catch (error: any) {
      console.error('Error creating negotiation:', error);
      toast({ title: 'Erro ao registrar negociação', description: error.message, variant: 'destructive' });
      throw error;
    }
  };

  const updateNegotiationStatus = async (id: string, status: string, extraFields?: Record<string, any>) => {
    try {
      const updateData: Record<string, any> = {
        status,
        updated_at: new Date().toISOString(),
        ...extraFields,
      };

      const { error } = await supabase
        .from('negotiations')
        .update(updateData)
        .eq('id', id);

      if (error) {
        if (error.message?.includes('Aguarde pelo menos')) {
          toast({ title: 'Ação bloqueada por segurança', description: error.message, variant: 'destructive' });
          return;
        }
        if (error.message?.includes('Transição inválida') || error.message?.includes('Apenas o') || error.message?.includes('Não é possível cancelar') || error.message?.includes('pagamento informado')) {
          toast({ title: 'Ação não permitida', description: error.message, variant: 'destructive' });
          return;
        }
        throw error;
      }
      toast({ title: 'Status atualizado', description: 'Status da negociação atualizado.' });
      await fetchNegotiations();
    } catch (error: any) {
      console.error('Error updating negotiation:', error);
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const reportPayment = async (id: string, proofUrl?: string, reference?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      if (!proofUrl && !reference) {
        toast({ title: 'Comprovante necessário', description: 'Anexe um comprovante ou informe a referência da transação.', variant: 'destructive' });
        return;
      }

      const { error } = await supabase
        .from('negotiations')
        .update({
          payment_state: 'reported_by_buyer',
          payment_reported_at: new Date().toISOString(),
          payment_proof_url: proofUrl || null,
          payment_reference: reference || null,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', id)
        .eq('buyer_id', user.id);

      if (error) throw error;
      toast({ title: 'Pagamento informado!', description: 'O fornecedor será notificado.' });
      await fetchNegotiations();
    } catch (error: any) {
      console.error('Error reporting payment:', error);
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const confirmPaymentReceived = async (id: string) => {
    try {
      const { error } = await supabase
        .from('negotiations')
        .update({
          payment_state: 'confirmed_by_supplier',
          payment_confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Pagamento confirmado!', description: 'Pagamento localizado com sucesso.' });
      await fetchNegotiations();
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const contestPayment = async (id: string, reason: string) => {
    try {
      if (!reason.trim()) {
        toast({ title: 'Motivo obrigatório', description: 'Informe o motivo da contestação.', variant: 'destructive' });
        return;
      }

      const { error } = await supabase
        .from('negotiations')
        .update({
          payment_state: 'contested_by_supplier',
          payment_contested_reason: reason,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Pagamento contestado', description: 'A contestação foi registrada.' });
      await fetchNegotiations();
    } catch (error: any) {
      console.error('Error contesting payment:', error);
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const uploadInvoice = async (id: string, file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const ext = file.name.split('.').pop();
      const path = `${user.id}/${id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('invoices')
        .getPublicUrl(path);

      const { error } = await supabase
        .from('negotiations')
        .update({
          invoice_url: urlData.publicUrl,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'NF anexada!', description: 'A nota fiscal foi enviada ao comprador.' });
      await fetchNegotiations();
    } catch (error: any) {
      console.error('Error uploading invoice:', error);
      toast({ title: 'Erro ao enviar NF', description: error.message, variant: 'destructive' });
    }
  };

  const confirmDelivery = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const neg = negotiations.find(n => n.id === id);
      if (neg) {
        const timing = getTimeUntilAllowed(neg);
        if (!timing.allowed) {
          toast({
            title: 'Aguarde para confirmar',
            description: `Você poderá confirmar a entrega em ${formatCountdown(timing.remainingMs)}`,
            variant: 'destructive'
          });
          return;
        }
      }

      const { error } = await supabase
        .from('negotiations')
        .update({
          status: 'delivered',
          buyer_confirmed_delivery: true,
          delivery_confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', id)
        .eq('buyer_id', user.id);

      if (error) {
        if (error.message?.includes('Aguarde pelo menos')) {
          toast({ title: 'Ação bloqueada por segurança', description: error.message, variant: 'destructive' });
          return;
        }
        throw error;
      }
      toast({ title: 'Entrega confirmada!', description: 'Obrigado por confirmar o recebimento.' });
      await fetchNegotiations();
    } catch (error: any) {
      console.error('Error confirming delivery:', error);
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const supplierAccept = async (id: string) => {
    const neg = negotiations.find(n => n.id === id);
    if (neg) {
      const timing = getTimeUntilAllowed(neg);
      if (!timing.allowed) {
        toast({
          title: 'Aguarde para aceitar',
          description: `Você poderá aceitar em ${formatCountdown(timing.remainingMs)}`,
          variant: 'destructive'
        });
        return;
      }
    }
    return updateNegotiationStatus(id, 'accepted');
  };

  const supplierShip = async (id: string) => {
    const neg = negotiations.find(n => n.id === id);
    if (neg) {
      const timing = getTimeUntilAllowed(neg);
      if (!timing.allowed) {
        toast({
          title: 'Aguarde para confirmar envio',
          description: `Você poderá confirmar o envio em ${formatCountdown(timing.remainingMs)}`,
          variant: 'destructive'
        });
        return;
      }
    }
    return updateNegotiationStatus(id, 'shipped', {
      supplier_confirmed_shipping: true,
      shipping_confirmed_at: new Date().toISOString(),
    });
  };

  const supplierCancel = async (id: string) => {
    return updateNegotiationStatus(id, 'cancelled');
  };

  const buyerCancel = async (id: string) => {
    return updateNegotiationStatus(id, 'cancelled');
  };

  return {
    negotiations,
    loading,
    createNegotiation,
    updateNegotiationStatus,
    confirmDelivery,
    supplierAccept,
    supplierShip,
    supplierCancel,
    buyerCancel,
    reportPayment,
    confirmPaymentReceived,
    contestPayment,
    uploadInvoice,
    refetch: fetchNegotiations
  };
};
