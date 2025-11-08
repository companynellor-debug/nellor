import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PaymentMethod {
  id: string;
  user_id: string;
  type: 'pix' | 'card';
  pix_key?: string;
  card_number_last4?: string;
  card_holder?: string;
  card_brand?: string;
  card_expiry?: string;
  is_default: boolean;
}

export const useSupabasePaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('is_default', { ascending: false });

      if (error) throw error;
      setPaymentMethods((data as any) || []);
    } catch (error: any) {
      console.error('Error fetching payment methods:', error);
      toast({
        title: 'Erro ao carregar métodos de pagamento',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const addPaymentMethod = async (method: Omit<PaymentMethod, 'id' | 'user_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('payment_methods')
        .insert([{ ...method, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Método de pagamento adicionado',
        description: 'Método salvo com sucesso!',
      });

      fetchPaymentMethods();
      return data;
    } catch (error: any) {
      console.error('Error adding payment method:', error);
      toast({
        title: 'Erro ao adicionar método',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deletePaymentMethod = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Método removido',
        description: 'Método de pagamento removido com sucesso!',
      });

      fetchPaymentMethods();
    } catch (error: any) {
      console.error('Error deleting payment method:', error);
      toast({
        title: 'Erro ao remover método',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const setDefaultPaymentMethod = async (id: string) => {
    try {
      // Primeiro, remover default de todos
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .neq('id', id);

      // Depois, definir o novo default
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Método padrão atualizado',
        description: 'Método definido como padrão!',
      });

      fetchPaymentMethods();
    } catch (error: any) {
      console.error('Error setting default payment method:', error);
      toast({
        title: 'Erro ao definir método padrão',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getDefaultPaymentMethod = () => {
    return paymentMethods.find(method => method.is_default);
  };

  return {
    paymentMethods,
    loading,
    addPaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    getDefaultPaymentMethod,
    refetch: fetchPaymentMethods
  };
};
