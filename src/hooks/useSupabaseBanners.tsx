import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('ativo', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as SupabaseBanner[];
    }
  });

  const addBanner = useMutation({
    mutationFn: async (banner: Omit<SupabaseBanner, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('banners')
        .insert([banner])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    }
  });

  const updateBanner = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SupabaseBanner> }) => {
      const { data, error } = await supabase
        .from('banners')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    }
  });

  const deleteBanner = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    }
  });

  const toggleBannerStatus = useMutation({
    mutationFn: async (id: string) => {
      // Get current status
      const { data: banner } = await supabase
        .from('banners')
        .select('ativo')
        .eq('id', id)
        .single();

      if (!banner) throw new Error('Banner not found');

      const { error } = await supabase
        .from('banners')
        .update({ ativo: !banner.ativo })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    }
  });

  return {
    banners,
    isLoading,
    addBanner: addBanner.mutateAsync,
    updateBanner: updateBanner.mutateAsync,
    deleteBanner: deleteBanner.mutateAsync,
    toggleBannerStatus: toggleBannerStatus.mutateAsync
  };
};
