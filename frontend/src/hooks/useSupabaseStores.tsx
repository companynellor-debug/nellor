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
      // Usar função RPC SECURITY DEFINER para garantir acesso público
      const { data, error } = await supabase.rpc('get_public_store_profiles');

      if (error) {
        console.error('Error fetching stores via RPC, falling back to view:', error);
        // Fallback to view
        const { data: viewData, error: viewError } = await supabase
          .from('public_supplier_profiles')
          .select('id, nome, descricao_loja, foto_perfil_url, banner_loja_url');
        
        if (viewError) throw viewError;
        
        const validStores: SupabaseStore[] = (viewData || [])
          .filter((s): s is typeof s & { id: string; nome: string } => 
            s.id !== null && s.nome !== null
          )
          .map(s => ({
            id: s.id,
            nome: s.nome,
            descricao_loja: s.descricao_loja,
            foto_perfil_url: s.foto_perfil_url,
            banner_loja_url: s.banner_loja_url
          }));
        
        setStores(validStores);
        return;
      }
      
      // Mapear dados da função RPC
      const validStores: SupabaseStore[] = (data || [])
        .filter((s: any) => s.id !== null && s.nome !== null)
        .map((s: any) => ({
          id: s.id,
          nome: s.nome,
          descricao_loja: s.descricao_loja,
          foto_perfil_url: s.foto_perfil_url,
          banner_loja_url: s.banner_loja_url
        }));
      
      setStores(validStores);
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
