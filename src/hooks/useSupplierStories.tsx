import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from './useSupabaseAuth';

export interface SupplierStory {
  id: string;
  supplier_id: string;
  media_url: string | null;
  caption: string | null;
  type: string;
  bg_color: string | null;
  created_at: string;
  expires_at: string;
}

export interface SupplierWithStories {
  supplierId: string;
  supplierName: string;
  supplierAvatar: string | null;
  stories: SupplierStory[];
  hasUnviewed: boolean;
}

export const useSupplierStories = () => {
  const { user } = useSupabaseAuth();
  const [stories, setStories] = useState<SupplierStory[]>([]);
  const [viewedStoryIds, setViewedStoryIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [supplierProfiles, setSupplierProfiles] = useState<Record<string, { nome: string; foto_perfil_url: string | null }>>({});

  const fetchStories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_stories')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories(data || []);

      // Fetch profiles for suppliers
      const supplierIds = [...new Set((data || []).map(s => s.supplier_id))];
      if (supplierIds.length > 0) {
        const { data: profiles } = await supabase.rpc('get_chat_participant_profiles', { _user_ids: supplierIds });
        
        const profileMap: Record<string, { nome: string; foto_perfil_url: string | null }> = {};
        (profiles as any[] || []).forEach((p: any) => { profileMap[p.id] = { nome: p.nome || 'Fornecedor', foto_perfil_url: p.foto_perfil_url }; });
        setSupplierProfiles(profileMap);
      }

      // Fetch viewed stories
      if (user) {
        const { data: views } = await supabase
          .from('story_views')
          .select('story_id')
          .eq('viewer_id', user.id);
        
        setViewedStoryIds(new Set((views || []).map(v => v.story_id)));
      }
    } catch (err) {
      console.error('Error fetching stories:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStories();

    const channel = supabase
      .channel('stories-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'supplier_stories' }, () => {
        fetchStories();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchStories]);

  const getGroupedStories = useCallback((): SupplierWithStories[] => {
    const grouped = new Map<string, SupplierStory[]>();
    stories.forEach(s => {
      if (!grouped.has(s.supplier_id)) grouped.set(s.supplier_id, []);
      grouped.get(s.supplier_id)!.push(s);
    });

    return Array.from(grouped.entries()).map(([supplierId, supplierStories]) => ({
      supplierId,
      supplierName: supplierProfiles[supplierId]?.nome || 'Fornecedor',
      supplierAvatar: supplierProfiles[supplierId]?.foto_perfil_url || null,
      stories: supplierStories.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
      hasUnviewed: supplierStories.some(s => !viewedStoryIds.has(s.id)),
    }));
  }, [stories, supplierProfiles, viewedStoryIds]);

  const markAsViewed = useCallback(async (storyId: string) => {
    if (!user || viewedStoryIds.has(storyId)) return;
    setViewedStoryIds(prev => new Set(prev).add(storyId));
    await supabase.from('story_views').insert({ story_id: storyId, viewer_id: user.id } as any);
  }, [user, viewedStoryIds]);

  const createStory = useCallback(async (data: { type: string; caption?: string; media_url?: string; bg_color?: string }) => {
    if (!user) return;
    const { error } = await supabase.from('supplier_stories').insert({
      supplier_id: user.id,
      type: data.type,
      caption: data.caption || null,
      media_url: data.media_url || null,
      bg_color: data.bg_color || '#7c3aed',
    } as any);
    if (error) throw error;
  }, [user]);

  const deleteStory = useCallback(async (storyId: string) => {
    await supabase.from('supplier_stories').delete().eq('id', storyId);
  }, []);

  const getMyStories = useCallback(() => {
    if (!user) return [];
    return stories.filter(s => s.supplier_id === user.id);
  }, [stories, user]);

  return {
    stories,
    loading,
    getGroupedStories,
    markAsViewed,
    createStory,
    deleteStory,
    getMyStories,
    fetchStories,
  };
};
