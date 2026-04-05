import { supabase } from '@/integrations/supabase/client';

export const logActivity = async (
  userId: string,
  action: string,
  description?: string
) => {
  try {
    await supabase.rpc('log_activity', {
      _user_id: userId,
      _action: action,
      _description: description || null,
      _ip_address: null,
      _user_agent: navigator.userAgent || null,
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};
