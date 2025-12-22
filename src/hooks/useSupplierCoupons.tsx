import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SupplierCoupon {
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
  product?: {
    id: string;
    nome: string;
  };
}

export const useSupplierCoupons = () => {
  const [coupons, setCoupons] = useState<SupplierCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setCoupons([]);
        return;
      }

      const { data, error } = await supabase
        .from('coupons')
        .select(`
          *,
          product:products(id, nome)
        `)
        .eq('supplier_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons((data || []) as SupplierCoupon[]);
    } catch (error: any) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const createCoupon = async (couponData: {
    codigo: string;
    tipo: 'percentage' | 'fixed';
    valor: number;
    product_id?: string | null;
    expira_em?: string | null;
    uso_maximo?: number | null;
    valor_minimo?: number;
  }) => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('coupons')
        .insert([{
          ...couponData,
          codigo: couponData.codigo.toUpperCase().trim(),
          supplier_id: user.id,
          ativo: true,
          uso_atual: 0
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Cupom criado!',
        description: `Cupom ${couponData.codigo} criado com sucesso.`,
      });

      fetchCoupons();
      return data;
    } catch (error: any) {
      console.error('Error creating coupon:', error);
      toast({
        title: 'Erro ao criar cupom',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const updateCoupon = async (id: string, updates: Partial<SupplierCoupon>) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('coupons')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Cupom atualizado',
      });

      fetchCoupons();
    } catch (error: any) {
      console.error('Error updating coupon:', error);
      toast({
        title: 'Erro ao atualizar cupom',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const deleteCoupon = async (id: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Cupom excluído',
      });

      fetchCoupons();
    } catch (error: any) {
      console.error('Error deleting coupon:', error);
      toast({
        title: 'Erro ao excluir cupom',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const toggleCouponStatus = async (id: string, ativo: boolean) => {
    await updateCoupon(id, { ativo });
  };

  return {
    coupons,
    loading,
    saving,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    toggleCouponStatus,
    refetch: fetchCoupons
  };
};
