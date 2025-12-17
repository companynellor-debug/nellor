import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Review {
  id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  photos: string[];
  created_at: string;
  buyer_first_name: string | null;
}

export const useSupabaseReviews = (productId?: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReviews = async () => {
    try {
      setLoading(true);
      // Usar VIEW pública que não expõe buyer_id completo (LGPD)
      let query = supabase
        .from('public_reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReviews(data || []);
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      toast({
        title: 'Erro ao carregar avaliações',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('reviews-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews',
          filter: productId ? `product_id=eq.${productId}` : undefined
        },
        () => {
          fetchReviews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId]);

  const createReview = async (review: {
    product_id: string;
    order_id?: string;
    rating: number;
    comment?: string;
    photos?: string[];
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('reviews')
        .insert({
          ...review,
          buyer_id: user.id,
        });

      if (error) throw error;

      toast({
        title: 'Avaliação enviada com sucesso!',
        description: 'Obrigado por avaliar o produto.',
      });

      fetchReviews();
      return true;
    } catch (error: any) {
      console.error('Error creating review:', error);
      toast({
        title: 'Erro ao enviar avaliação',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const canReviewProduct = async (productId: string, orderId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Verificar se já avaliou este produto
      const { data, error } = await supabase
        .from('reviews')
        .select('id')
        .eq('product_id', productId)
        .eq('buyer_id', user.id);

      if (error) throw error;

      if (orderId) {
        return !data?.some(r => r.id === orderId);
      }

      return data?.length === 0;
    } catch (error) {
      console.error('Error checking review status:', error);
      return false;
    }
  };

  return {
    reviews,
    loading,
    createReview,
    canReviewProduct,
    refetch: fetchReviews
  };
};
