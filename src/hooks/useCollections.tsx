import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from './useSupabaseAuth';
import { toast } from '@/hooks/use-toast';

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean | null;
  share_token: string | null;
  created_at: string | null;
  items_count?: number;
}

export interface CollectionItem {
  id: string;
  collection_id: string;
  type: 'product' | 'supplier';
  reference_id: string;
  added_at: string | null;
}

export const useCollections = () => {
  const { user } = useSupabaseAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [sharedCollections, setSharedCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCollections = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
        const { data: myCollections, error: myCollectionsError } = await supabase
          .from('collections')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (myCollectionsError) throw myCollectionsError;

      if (myCollections) {
        const withCounts = await Promise.all(
          myCollections.map(async (col) => {
            const { count } = await supabase
              .from('collection_items')
              .select('*', { count: 'exact', head: true })
              .eq('collection_id', col.id);
            return { ...col, items_count: count || 0 };
          })
        );
        setCollections(withCounts);
      }

      const { data: memberships, error: membershipsError } = await supabase
        .from('collection_members')
        .select('collection_id')
        .eq('user_id', user.id);

      if (membershipsError) throw membershipsError;

      if (memberships && memberships.length > 0) {
        const ids = memberships.map((m) => m.collection_id);
        const { data: sharedCols } = await supabase
          .from('collections')
          .select('*')
          .in('id', ids)
          .order('created_at', { ascending: false });
        if (sharedCols) setSharedCollections(sharedCols);
      } else {
        setSharedCollections([]);
      }
    } catch (err) {
      console.error('Error fetching collections:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const createCollection = async (name: string, description?: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('collections')
      .insert({ user_id: user.id, name, description: description || null, is_public: false });
    if (error) {
      toast({ title: 'Erro ao criar pasta', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Pasta criada!', description: `${name} foi criada com sucesso.` });
      fetchCollections();
    }
  };

  const deleteCollection = async (id: string) => {
    const { error } = await supabase.from('collections').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' });
    } else {
      toast({ title: 'Pasta excluída' });
      setCollections((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const addItemToCollection = async (
    collectionId: string,
    type: 'product' | 'supplier',
    referenceId: string
  ) => {
    const { error } = await supabase
      .from('collection_items')
      .insert({ collection_id: collectionId, type, reference_id: referenceId });
    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Já adicionado', description: 'Este item já está nessa pasta.' });
      } else {
        toast({ title: 'Erro ao adicionar', description: error.message, variant: 'destructive' });
      }
      return false;
    }
    toast({ title: 'Salvo na pasta!' });
    fetchCollections();
    return true;
  };

  const removeItemFromCollection = async (itemId: string) => {
    const { error } = await supabase.from('collection_items').delete().eq('id', itemId);
    if (error) {
      toast({ title: 'Erro ao remover item', variant: 'destructive' });
    } else {
      toast({ title: 'Item removido da pasta' });
    }
  };

  const inviteToCollection = async (collectionId: string, email: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (!profile) {
      toast({
        title: 'Usuário não encontrado',
        description: 'Nenhuma conta com este email.',
        variant: 'destructive',
      });
      return false;
    }

    const { error } = await supabase
      .from('collection_members')
      .insert({ collection_id: collectionId, user_id: profile.id });

    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Já convidado', description: 'Este usuário já tem acesso.' });
      } else {
        toast({ title: 'Erro ao convidar', description: error.message, variant: 'destructive' });
      }
      return false;
    }
    toast({ title: 'Convidado com sucesso!' });
    return true;
  };

  const getCollectionItems = async (collectionId: string): Promise<CollectionItem[]> => {
    const { data } = await supabase
      .from('collection_items')
      .select('*')
      .eq('collection_id', collectionId)
      .order('added_at', { ascending: false });
    return (data as CollectionItem[]) || [];
  };

  const getShareUrl = (shareToken: string) => `${window.location.origin}/pasta/${shareToken}`;

  return {
    collections,
    sharedCollections,
    loading,
    createCollection,
    deleteCollection,
    addItemToCollection,
    removeItemFromCollection,
    inviteToCollection,
    getCollectionItems,
    getShareUrl,
    refetch: fetchCollections,
  };
};
