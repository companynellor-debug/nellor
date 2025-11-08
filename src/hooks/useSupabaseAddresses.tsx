import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Address {
  id: string;
  user_id: string;
  label: string;
  name: string;
  document: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  is_default: boolean;
}

export const useSupabaseAddresses = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .order('is_default', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error: any) {
      console.error('Error fetching addresses:', error);
      toast({
        title: 'Erro ao carregar endereços',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const addAddress = async (address: Omit<Address, 'id' | 'user_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('addresses')
        .insert([{ ...address, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Endereço adicionado',
        description: 'Endereço salvo com sucesso!',
      });

      fetchAddresses();
      return data;
    } catch (error: any) {
      console.error('Error adding address:', error);
      toast({
        title: 'Erro ao adicionar endereço',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Endereço removido',
        description: 'Endereço removido com sucesso!',
      });

      fetchAddresses();
    } catch (error: any) {
      console.error('Error deleting address:', error);
      toast({
        title: 'Erro ao remover endereço',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const setDefaultAddress = async (id: string) => {
    try {
      // Primeiro, remover default de todos
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .neq('id', id);

      // Depois, definir o novo default
      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Endereço padrão atualizado',
        description: 'Endereço definido como padrão!',
      });

      fetchAddresses();
    } catch (error: any) {
      console.error('Error setting default address:', error);
      toast({
        title: 'Erro ao definir endereço padrão',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getDefaultAddress = () => {
    return addresses.find(address => address.is_default);
  };

  return {
    addresses,
    loading,
    addAddress,
    deleteAddress,
    setDefaultAddress,
    getDefaultAddress,
    refetch: fetchAddresses
  };
};
