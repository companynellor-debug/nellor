import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StoreProfile {
  storeName: string;
  bio: string;
  avatar: string;
  banner: string;
  whatsapp: string;
  address: string;
  minOrderQuantity: number;
  minOrderValue: number;
  customCategories: string[];
}

const defaultStoreProfile: StoreProfile = {
  storeName: "", bio: "", avatar: "", banner: "", whatsapp: "", address: "",
  minOrderQuantity: 0, minOrderValue: 0, customCategories: [],
};

// Module-level cache
let profileCache: StoreProfile | null = null;
let cachedUserId: string | null = null;

export const useStoreProfile = () => {
  const [storeProfile, setStoreProfile] = useState<StoreProfile>(profileCache || defaultStoreProfile);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) setUserId(session.user.id);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) { setStoreProfile(defaultStoreProfile); return; }

    // Use cache if same user
    if (profileCache && cachedUserId === userId) {
      setStoreProfile(profileCache);
      return;
    }

    const fetchProfile = async () => {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('nome, descricao_loja, foto_perfil_url, banner_loja_url, telefone, endereco_principal')
        .eq('id', userId)
        .single();

      if (error) { console.error('Error fetching store profile:', error); return; }

      if (profile) {
        const mapped: StoreProfile = {
          storeName: profile.nome || "",
          bio: profile.descricao_loja || "",
          avatar: profile.foto_perfil_url || "",
          banner: profile.banner_loja_url || "",
          whatsapp: profile.telefone || "",
          address: profile.endereco_principal as any || "",
          minOrderQuantity: 0, minOrderValue: 0, customCategories: [],
        };
        profileCache = mapped;
        cachedUserId = userId;
        setStoreProfile(mapped);
      }
    };

    fetchProfile();
  }, [userId]);

  const updateStoreProfile = async (newData: Partial<StoreProfile>) => {
    if (!userId) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nome: newData.storeName,
          descricao_loja: newData.bio,
          foto_perfil_url: newData.avatar,
          banner_loja_url: newData.banner,
          telefone: newData.whatsapp,
        } as any)
        .eq('id', userId);

      if (error) throw error;
      const updated = { ...storeProfile, ...newData };
      profileCache = updated;
      setStoreProfile(updated);
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error("Erro ao atualizar perfil da loja");
    }
  };

  return { storeProfile, updateStoreProfile };
};
