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

      if (error) throw error;
      toast({ title: 'Status atualizado', description: 'Status da negociação atualizado.' });
      await fetchNegotiations();
    } catch (error: any) {
      console.error('Error updating negotiation:', error);
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  // Only buyer can call this - confirms delivery bilaterally
  const confirmDelivery = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('negotiations')
        .update({
          status: 'delivered',
          buyer_confirmed_delivery: true,
          delivery_confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', id)
        .eq('buyer_id', user.id); // Ensure only buyer can confirm

      if (error) throw error;
      toast({ title: 'Entrega confirmada!', description: 'Obrigado por confirmar o recebimento.' });
      await fetchNegotiations();
    } catch (error: any) {
      console.error('Error confirming delivery:', error);
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  // Supplier actions only
  const supplierAccept = async (id: string) => {
    return updateNegotiationStatus(id, 'accepted');
  };

  const supplierShip = async (id: string) => {
    return updateNegotiationStatus(id, 'shipped', {
      supplier_confirmed_shipping: true,
      shipping_confirmed_at: new Date().toISOString(),
    });
  };

  const supplierCancel = async (id: string) => {
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
    refetch: fetchNegotiations 
  };
};
