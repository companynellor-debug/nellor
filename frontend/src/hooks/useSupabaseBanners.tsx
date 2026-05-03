import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface SupabaseBanner {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  order_index: number;
  ativo: boolean;
  created_at: string;
}

export const useSupabaseBanners = () => {
  const queryClient = useQueryClient();

  const { data: banners = [], isLoading, refetch } = useQuery({
    queryKey: ['banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('ativo', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as SupabaseBanner[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Realtime subscription para atualização automática
  useEffect(() => {
    const channel = supabase
      .channel('banners-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'banners'
        },
        (payload) => {
          console.log('[Banners] Realtime update:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['banners'] });
        }
      )
      .subscribe((status) => {
        console.log('[Banners] Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    banners,
    isLoading,
    refetch
  };
};
