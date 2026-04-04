import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SponsoredProduct {
  id: string;
  product_id: string;
  supplier_id: string;
  status: string;
  approved_at: string | null;
  expires_at: string | null;
}

export const useSponsoredProducts = () => {
  const { data: sponsoredIds = [] } = useQuery({
    queryKey: ['sponsored-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsored_products')
        .select('product_id')
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching sponsored products:', error);
        return [];
      }
      return (data || []).map((d: any) => d.product_id as string);
    },
    staleTime: 1000 * 60 * 5,
  });

  return { sponsoredIds };
};
