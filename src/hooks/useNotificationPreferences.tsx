import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  order_updates: boolean;
  messages: boolean;
  promotions: boolean;
  price_alerts: boolean;
  delivery_updates: boolean;
  payment_confirmations: boolean;
  push_enabled: boolean;
  sound_enabled: boolean;
  email_enabled: boolean;
  created_at: string;
  updated_at: string;
}

const defaultPreferences: Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  order_updates: true,
  messages: true,
  promotions: true,
  price_alerts: true,
  delivery_updates: true,
  payment_confirmations: true,
  push_enabled: true,
  sound_enabled: true,
  email_enabled: false,
};

export const useNotificationPreferences = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setPreferences(null);
        return;
      }

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences(data as NotificationPreferences);
      } else {
        // Create default preferences if none exist
        const { data: newData, error: insertError } = await supabase
          .from('notification_preferences')
          .insert([{ user_id: user.id, ...defaultPreferences }])
          .select()
          .single();

        if (insertError) throw insertError;
        setPreferences(newData as NotificationPreferences);
      }
    } catch (error: any) {
      console.error('Error fetching notification preferences:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreference = async (key: keyof Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>, value: boolean) => {
    if (!preferences) return;

    try {
      setSaving(true);
      
      // Optimistic update
      setPreferences(prev => prev ? { ...prev, [key]: value } : null);

      const { error } = await supabase
        .from('notification_preferences')
        .update({ [key]: value })
        .eq('id', preferences.id);

      if (error) throw error;

      toast({
        title: 'Preferência atualizada',
        description: 'Suas configurações foram salvas.',
      });
    } catch (error: any) {
      // Revert on error
      setPreferences(prev => prev ? { ...prev, [key]: !value } : null);
      console.error('Error updating preference:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    preferences,
    loading,
    saving,
    updatePreference,
    refetch: fetchPreferences
  };
};
