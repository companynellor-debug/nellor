import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SupplierReview {
  id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  photos: string[];
  created_at: string;
  buyer_first_name: string | null;
}

export const useSupplierReviews = (supplierId?: string) => {
  const [reviews, setReviews] = useState<SupplierReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supplierId) {
      setReviews([]);
      setLoading(false);
      return;
    }

    const fetchReviews = async () => {
      setLoading(true);
      try {
        // Fetch product IDs for this supplier first
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id')
          .eq('supplier_id', supplierId)
          .eq('ativo', true);

        if (productsError) throw productsError;

        const productIds = (products || []).map((p) => p.id);

        if (productIds.length === 0) {
          setReviews([]);
          return;
        }

        // Fetch reviews from public_reviews view filtered by those product IDs
        const { data, error } = await supabase
          .from('public_reviews')
          .select('*')
          .in('product_id', productIds)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReviews((data || []) as SupplierReview[]);
      } catch (err) {
        console.error('Error fetching supplier reviews:', err);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();

    // Realtime subscription on reviews table
    const channel = supabase
      .channel(`supplier-reviews-${supplierId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews' },
        () => { fetchReviews(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supplierId]);

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return { reviews, loading, averageRating };
};
