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
  status: 'pending' | 'accepted' | 'delivered' | 'disputed' | 'cancelled';
  buyer_confirmed_delivery: boolean;
  delivery_confirmed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useNegotiations = () => {
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchNegotiations = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('negotiations' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNegotiations((data || []) as any as Negotiation[]);
    } catch (error: any) {
      console.error('Error fetching negotiations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

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

      const { data: result, error } = await supabase
        .from('negotiations' as any)
        .insert([{
          buyer_id: user.id,
          supplier_id: data.supplier_id,
          product_id: data.product_id || null,
          product_name: data.product_name,
          quantity: data.quantity,
          agreed_price: data.agreed_price,
          payment_method: data.payment_method,
          expected_delivery: data.expected_delivery || null,
          notes: data.notes || null,
        }] as any)
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

  const updateNegotiationStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('negotiations' as any)
        .update({ 
          status, 
          updated_at: new Date().toISOString(),
          ...(status === 'delivered' ? { buyer_confirmed_delivery: true, delivery_confirmed_at: new Date().toISOString() } : {})
        } as any)
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Status atualizado', description: 'Status da negociação atualizado.' });
      await fetchNegotiations();
    } catch (error: any) {
      console.error('Error updating negotiation:', error);
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  return { negotiations, loading, createNegotiation, updateNegotiationStatus, refetch: fetchNegotiations };
};
