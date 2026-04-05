import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/formatCurrency';

export interface Coupon {
  id: string;
  supplier_id: string;
  product_id: string | null;
  codigo: string;
  tipo: 'percentage' | 'fixed';
  valor: number;
  ativo: boolean;
  expira_em: string | null;
  uso_maximo: number | null;
  uso_atual: number;
  valor_minimo: number;
  created_at: string;
}

export interface AppliedCoupon {
  coupon: Coupon;
  discount: number;
  supplierId: string;
}

export const useCoupons = () => {
  const [loading, setLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const { toast } = useToast();

  const validateCoupon = useCallback(async (
    code: string, 
    supplierId: string, 
    subtotal: number,
    productIds?: string[]
  ): Promise<AppliedCoupon | null> => {
    try {
      setLoading(true);

      // Fetch coupon by code and supplier
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('codigo', code.toUpperCase().trim())
        .eq('supplier_id', supplierId)
        .eq('ativo', true)
        .maybeSingle();

      if (error) throw error;

      if (!coupon) {
        toast({
          title: 'Cupom inválido',
          description: 'Este cupom não existe ou não está disponível para este fornecedor.',
          variant: 'destructive',
        });
        return null;
      }

      // Check expiration
      if (coupon.expira_em && new Date(coupon.expira_em) < new Date()) {
        toast({
          title: 'Cupom expirado',
          description: 'Este cupom já expirou.',
          variant: 'destructive',
        });
        return null;
      }

      // Check usage limit
      if (coupon.uso_maximo !== null && coupon.uso_atual >= coupon.uso_maximo) {
        toast({
          title: 'Cupom esgotado',
          description: 'Este cupom atingiu o limite de uso.',
          variant: 'destructive',
        });
        return null;
      }

      // Check minimum order value
      if (coupon.valor_minimo && subtotal < coupon.valor_minimo) {
        toast({
          title: 'Valor mínimo não atingido',
          description: `Pedido mínimo de ${formatCurrency(coupon.valor_minimo)} para usar este cupom.`,
          variant: 'destructive',
        });
        return null;
      }

      // Check if coupon is product-specific
      if (coupon.product_id && productIds && !productIds.includes(coupon.product_id)) {
        toast({
          title: 'Cupom não aplicável',
          description: 'Este cupom é válido apenas para um produto específico que não está no carrinho.',
          variant: 'destructive',
        });
        return null;
      }

      // Calculate discount
      let discount = 0;
      if (coupon.tipo === 'percentage') {
        discount = subtotal * (coupon.valor / 100);
      } else {
        discount = Math.min(coupon.valor, subtotal);
      }

      const appliedCoupon: AppliedCoupon = {
        coupon: coupon as Coupon,
        discount,
        supplierId
      };

      setAppliedCoupon(appliedCoupon);
      
      toast({
        title: 'Cupom aplicado!',
        description: `Desconto de ${formatCurrency(discount)} aplicado.`,
      });

      return appliedCoupon;
    } catch (error: any) {
      console.error('Error validating coupon:', error);
      toast({
        title: 'Erro ao validar cupom',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const incrementCouponUsage = async (couponId: string) => {
    try {
      // Get current usage and increment
      const { data: currentCoupon } = await supabase
        .from('coupons')
        .select('uso_atual')
        .eq('id', couponId)
        .single();
      
      if (currentCoupon) {
        await supabase
          .from('coupons')
          .update({ uso_atual: (currentCoupon.uso_atual || 0) + 1 })
          .eq('id', couponId);
      }
    } catch (error) {
      console.error('Error incrementing coupon usage:', error);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    toast({
      title: 'Cupom removido',
    });
  };

  return {
    loading,
    appliedCoupon,
    validateCoupon,
    incrementCouponUsage,
    removeCoupon
  };
};
