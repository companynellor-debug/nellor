import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SupabaseStore {
  id: string;
  nome: string;
  descricao_loja: string | null;
  foto_perfil_url: string | null;
  banner_loja_url: string | null;
}

export const useSupabaseStores = () => {
  const [stores, setStores] = useState<SupabaseStore[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStores = async () => {
    try {
      setLoading(true);
      // Usar VIEW pública que não expõe dados sensíveis (LGPD)
      const { data, error } = await supabase
        .from('public_supplier_profiles')
        .select('id, nome, descricao_loja, foto_perfil_url, banner_loja_url');

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();

    // Subscribe to realtime changes on profiles
    const channel = supabase
      .channel('profiles-stores-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: 'tipo=eq.fornecedor'
        },
        () => {
          fetchStores();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStoreById = (id: string) => {
    return stores.find(s => s.id === id);
  };

  return {
    stores,
    loading,
    getStoreById,
    refetch: fetchStores
  };
};
