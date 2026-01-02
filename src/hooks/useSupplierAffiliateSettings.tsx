import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { toast } from 'sonner';

export interface AffiliateSettings {
  id: string;
  supplier_id: string;
  allow_affiliates: boolean;
  default_commission_percent: number;
  commission_duration_days: number;
  allow_recurring_commission: boolean;
  recurring_duration_months: number;
}

export const useSupplierAffiliateSettings = () => {
  const { profile } = useSupabaseAuth();
  const [settings, setSettings] = useState<AffiliateSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('supplier_affiliate_settings')
        .select('*')
        .eq('supplier_id', profile.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          id: data.id,
          supplier_id: data.supplier_id,
          allow_affiliates: data.allow_affiliates ?? false,
          default_commission_percent: data.default_commission_percent ?? 5,
          commission_duration_days: data.commission_duration_days ?? 120,
          allow_recurring_commission: data.allow_recurring_commission ?? false,
          recurring_duration_months: data.recurring_duration_months ?? 4,
        });
      } else {
        // Create default settings
        setSettings({
          id: '',
          supplier_id: profile.id,
          allow_affiliates: false,
          default_commission_percent: 5,
          commission_duration_days: 120,
          allow_recurring_commission: false,
          recurring_duration_months: 4,
        });
      }
    } catch (error: any) {
      console.error('Error fetching affiliate settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [profile?.id]);

  const saveSettings = async (newSettings: Partial<AffiliateSettings>) => {
    if (!profile?.id) return;

    try {
      setSaving(true);

      const updateData = {
        supplier_id: profile.id,
        allow_affiliates: newSettings.allow_affiliates ?? settings?.allow_affiliates ?? false,
        default_commission_percent: newSettings.default_commission_percent ?? settings?.default_commission_percent ?? 5,
        commission_duration_days: newSettings.commission_duration_days ?? settings?.commission_duration_days ?? 120,
        allow_recurring_commission: newSettings.allow_recurring_commission ?? settings?.allow_recurring_commission ?? false,
        recurring_duration_months: newSettings.recurring_duration_months ?? settings?.recurring_duration_months ?? 4,
      };

      const { data, error } = await supabase
        .from('supplier_affiliate_settings')
        .upsert(updateData, { onConflict: 'supplier_id' })
        .select()
        .single();

      if (error) throw error;

      setSettings({
        id: data.id,
        supplier_id: data.supplier_id,
        allow_affiliates: data.allow_affiliates ?? false,
        default_commission_percent: data.default_commission_percent ?? 5,
        commission_duration_days: data.commission_duration_days ?? 120,
        allow_recurring_commission: data.allow_recurring_commission ?? false,
        recurring_duration_months: data.recurring_duration_months ?? 4,
      });

      toast.success('Configurações de afiliados salvas!');
      return true;
    } catch (error: any) {
      console.error('Error saving affiliate settings:', error);
      toast.error('Erro ao salvar configurações');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    settings,
    loading,
    saving,
    saveSettings,
    refetch: fetchSettings,
  };
};
