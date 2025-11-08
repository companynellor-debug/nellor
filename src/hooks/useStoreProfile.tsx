import { useState, useEffect } from "react";
import { useSupabaseAuth } from "./useSupabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StoreProfile {
  storeName: string;
  bio: string;
  avatar: string;
  banner: string;
  whatsapp: string;
  address: string;
  pixKey: string;
  minOrderQuantity: number;
  minOrderValue: number;
  customCategories: string[];
}

export const useStoreProfile = () => {
  const { user, profile } = useSupabaseAuth();
  const [storeProfile, setStoreProfile] = useState<StoreProfile>({
    storeName: "",
    bio: "",
    avatar: "",
    banner: "",
    whatsapp: "",
    address: "",
    pixKey: "",
    minOrderQuantity: 0,
    minOrderValue: 0,
    customCategories: [],
  });

  useEffect(() => {
    if (profile) {
      setStoreProfile({
        storeName: profile.nome || "",
        bio: profile.descricao_loja || "",
        avatar: profile.foto_perfil_url || "",
        banner: profile.banner_loja_url || "",
        whatsapp: profile.telefone || "",
        address: profile.endereco_principal as any || "",
        pixKey: profile.pix_key || "",
        minOrderQuantity: 0,
        minOrderValue: 0,
        customCategories: [],
      });
    }
  }, [profile]);

  const updateStoreProfile = async (newData: Partial<StoreProfile>) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nome: newData.storeName,
          descricao_loja: newData.bio,
          foto_perfil_url: newData.avatar,
          banner_loja_url: newData.banner,
          telefone: newData.whatsapp,
          pix_key: newData.pixKey,
        })
        .eq('id', user.id);

      if (error) throw error;

      setStoreProfile({ ...storeProfile, ...newData });
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error("Erro ao atualizar perfil da loja");
    }
  };

  return { storeProfile, updateStoreProfile };
};
