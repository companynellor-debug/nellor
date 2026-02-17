import { useState, useEffect, useContext, createContext } from "react";
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
  storeName: "",
  bio: "",
  avatar: "",
  banner: "",
  whatsapp: "",
  address: "",
  minOrderQuantity: 0,
  minOrderValue: 0,
  customCategories: [],
};

export const useStoreProfile = () => {
  const [storeProfile, setStoreProfile] = useState<StoreProfile>(defaultStoreProfile);
  const [userId, setUserId] = useState<string | null>(null);

  // Get user directly from supabase instead of context to avoid dependency issues
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch profile when userId changes
  useEffect(() => {
    if (!userId) {
      setStoreProfile(defaultStoreProfile);
      return;
    }

    const fetchProfile = async () => {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching store profile:', error);
        return;
      }

      if (profile) {
        setStoreProfile({
          storeName: profile.nome || "",
          bio: profile.descricao_loja || "",
          avatar: profile.foto_perfil_url || "",
          banner: profile.banner_loja_url || "",
          whatsapp: profile.telefone || "",
          address: profile.endereco_principal as any || "",
          minOrderQuantity: (profile as any).min_order_quantity || 0,
          minOrderValue: (profile as any).min_order_value || 0,
          customCategories: [],
        });
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
          ...(newData.minOrderQuantity !== undefined && { min_order_quantity: newData.minOrderQuantity }),
          ...(newData.minOrderValue !== undefined && { min_order_value: newData.minOrderValue }),
        } as any)
        .eq('id', userId);

      if (error) throw error;

      setStoreProfile({ ...storeProfile, ...newData });
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error("Erro ao atualizar perfil da loja");
    }
  };

  return { storeProfile, updateStoreProfile };
};
