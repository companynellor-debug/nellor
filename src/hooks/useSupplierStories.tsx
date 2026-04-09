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

interface StoryViewerRecord {
  viewer_id: string;
  viewer_name: string | null;
  viewer_photo: string | null;
  viewed_at: string;
}

export const useSupplierStories = () => {
  const { user } = useSupabaseAuth();
  const [stories, setStories] = useState<SupplierStory[]>([]);
  const [viewedStoryIds, setViewedStoryIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [storyViewsVersion, setStoryViewsVersion] = useState(0);
  const [supplierProfiles, setSupplierProfiles] = useState<Record<string, { nome: string; foto_perfil_url: string | null }>>({});

  const fetchStories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_stories')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories((data || []) as SupplierStory[]);

      const supplierIds = [...new Set((data || []).map((story) => story.supplier_id))];
      if (supplierIds.length > 0) {
        const { data: profiles } = await supabase.rpc('get_chat_participant_profiles', { _user_ids: supplierIds });
        const profileMap: Record<string, { nome: string; foto_perfil_url: string | null }> = {};
        (profiles as any[] || []).forEach((profile: any) => {
          profileMap[profile.id] = {
            nome: profile.nome || 'Fornecedor',
            foto_perfil_url: profile.foto_perfil_url,
          };
        });
        setSupplierProfiles(profileMap);
      }

      if (user) {
        const { data: views } = await supabase
          .from('story_views')
          .select('story_id')
          .eq('viewer_id', user.id);
        setViewedStoryIds(new Set((views || []).map((view) => view.story_id)));
      }
    } catch (err) {
      console.error('Error fetching stories:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchStories();

    const channel = supabase
      .channel(`stories-realtime-${user?.id || 'anon'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'supplier_stories' }, () => {
        void fetchStories();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'story_views' }, (payload) => {
        setStoryViewsVersion((prev) => prev + 1);
        const nextViewerId = (payload.new as { viewer_id?: string } | null)?.viewer_id;
        if (nextViewerId && nextViewerId === user?.id) {
          void fetchStories();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStories, user?.id]);

  const getGroupedStories = useCallback((): SupplierWithStories[] => {
    const grouped = new Map<string, SupplierStory[]>();

    stories.forEach((story) => {
      if (!grouped.has(story.supplier_id)) grouped.set(story.supplier_id, []);
      grouped.get(story.supplier_id)!.push(story);
    });

    return Array.from(grouped.entries()).map(([supplierId, supplierStories]) => ({
      supplierId,
      supplierName: supplierProfiles[supplierId]?.nome || 'Fornecedor',
      supplierAvatar: supplierProfiles[supplierId]?.foto_perfil_url || null,
      stories: supplierStories.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
      hasUnviewed: supplierStories.some((story) => !viewedStoryIds.has(story.id)),
    }));
  }, [stories, supplierProfiles, viewedStoryIds]);

  const markAsViewed = useCallback(async (storyId: string) => {
    if (!user || viewedStoryIds.has(storyId)) return;

    setViewedStoryIds((prev) => new Set(prev).add(storyId));
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
    await fetchStories();
  }, [user, fetchStories]);

  const deleteStory = useCallback(async (storyId: string) => {
    const { error } = await supabase.from('supplier_stories').delete().eq('id', storyId);
    if (error) throw error;
    setStories((prev) => prev.filter((story) => story.id !== storyId));
    setStoryViewsVersion((prev) => prev + 1);
  }, []);

  const getMyStories = useCallback(() => {
    if (!user) return [];
    return stories.filter((story) => story.supplier_id === user.id);
  }, [stories, user]);

  const getStoryViews = useCallback(async (storyId: string): Promise<StoryViewerRecord[]> => {
    const { data, error } = await supabase.rpc('get_story_views', { _story_id: storyId });
    if (error) {
      console.error('Error fetching story views:', error);
      return [];
    }
    return (data || []) as StoryViewerRecord[];
  }, []);

  const getMyStoryStats = useCallback(async () => {
    if (!user) return { activeCount: 0, totalViews: 0, avgViews: 0 };

    const myActiveStories = stories.filter((story) => story.supplier_id === user.id);
    if (myActiveStories.length === 0) return { activeCount: 0, totalViews: 0, avgViews: 0 };

    const viewGroups = await Promise.all(myActiveStories.map((story) => getStoryViews(story.id)));
    const totalViews = viewGroups.reduce((sum, viewers) => sum + viewers.length, 0);

    return {
      activeCount: myActiveStories.length,
      totalViews,
      avgViews: Math.round(totalViews / myActiveStories.length),
    };
  }, [stories, user, getStoryViews]);

  const getStoryViewCount = useCallback(async (storyId: string) => {
    const viewers = await getStoryViews(storyId);
    return viewers.length;
  }, [getStoryViews]);

  return {
    stories,
    loading,
    storyViewsVersion,
    getGroupedStories,
    markAsViewed,
    createStory,
    deleteStory,
    getMyStories,
    fetchStories,
    getMyStoryStats,
    getStoryViews,
    getStoryViewCount,
  };
};
