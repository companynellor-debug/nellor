import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

interface ActivityLog {
  id: string;
  action: string;
  description: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export const useSecurityLogs = () => {
  const { user } = useSupabaseAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_my_activity_logs');
        if (error) throw error;
        setLogs((data as ActivityLog[]) || []);
      } catch (error) {
        console.error('Error fetching activity logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [user]);

  return { logs, loading };
};
