import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Dispute {
  id: string;
  negotiation_id: string;
  buyer_id: string;
  supplier_id: string;
  reason: string;
  description: string | null;
  status: 'open' | 'resolved' | 'scam_confirmed' | 'buyer_issue';
  admin_notes: string | null;
  supplier_response: string | null;
  supplier_responded_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useDisputes = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDisputes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('disputes' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDisputes((data || []) as any as Dispute[]);
    } catch (error: any) {
      console.error('Error fetching disputes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const createDispute = async (data: {
    negotiation_id: string;
    supplier_id: string;
    reason?: string;
    description?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('disputes' as any)
        .insert([{
          negotiation_id: data.negotiation_id,
          buyer_id: user.id,
          supplier_id: data.supplier_id,
          reason: data.reason || 'not_received',
          description: data.description || null,
        }] as any);

      if (error) throw error;

      toast({ title: 'Disputa aberta', description: 'Sua disputa foi registrada. O fornecedor será notificado.' });
      await fetchDisputes();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const respondToDispute = async (id: string, response: string) => {
    try {
      const { error } = await supabase
        .from('disputes' as any)
        .update({
          supplier_response: response,
          supplier_responded_at: new Date().toISOString(),
        } as any)
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Resposta enviada' });
      await fetchDisputes();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  return { disputes, loading, createDispute, respondToDispute, refetch: fetchDisputes };
};
