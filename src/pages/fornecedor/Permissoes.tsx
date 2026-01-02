import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Briefcase, 
  Loader2,
  Save,
  Percent,
  Calendar,
  Image,
  DollarSign,
  Package,
  FileText
} from "lucide-react";
import { ServiceProviderCodePanel } from "@/components/fornecedor/ServiceProviderCodePanel";
import { ServiceProviderRequestsPanel } from "@/components/fornecedor/ServiceProviderRequestsPanel";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "sonner";

interface AffiliateSettings {
  id?: string;
  allow_affiliates: boolean;
  default_commission_percent: number;
  allow_recurring_commission: boolean;
  recurring_duration_months: number;
}

interface ServiceProviderSettings {
  id?: string;
  allow_service_providers: boolean;
  can_edit_price: boolean;
  can_edit_stock: boolean;
  can_edit_photos: boolean;
  can_edit_description: boolean;
}

const Permissoes = () => {
  const { user } = useSupabaseAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [affiliateSettings, setAffiliateSettings] = useState<AffiliateSettings>({
    allow_affiliates: false,
    default_commission_percent: 5,
    allow_recurring_commission: false,
    recurring_duration_months: 4
  });
  
  const [spSettings, setSpSettings] = useState<ServiceProviderSettings>({
    allow_service_providers: false,
    can_edit_price: false,
    can_edit_stock: false,
    can_edit_photos: false,
    can_edit_description: false
  });

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch affiliate settings
      const { data: affData } = await supabase
        .from('supplier_affiliate_settings')
        .select('*')
        .eq('supplier_id', user.id)
        .single();
      
      if (affData) {
        setAffiliateSettings(affData);
      }
      
      // Fetch service provider settings
      const { data: spData } = await supabase
        .from('supplier_service_provider_settings')
        .select('*')
        .eq('supplier_id', user.id)
        .single();
      
      if (spData) {
        setSpSettings(spData);
      }
    } catch (error) {
      // Settings don't exist yet, use defaults
      console.log('Settings not found, using defaults');
    } finally {
      setLoading(false);
    }
  };

  const saveAffiliateSettings = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('supplier_affiliate_settings')
        .upsert({
          supplier_id: user.id,
          allow_affiliates: affiliateSettings.allow_affiliates,
          default_commission_percent: affiliateSettings.default_commission_percent,
          allow_recurring_commission: affiliateSettings.allow_recurring_commission,
          recurring_duration_months: affiliateSettings.recurring_duration_months
        }, { onConflict: 'supplier_id' });
      
      if (error) throw error;
      toast.success('Configurações de afiliados salvas!');
    } catch (error: any) {
      console.error('Error saving affiliate settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const saveSpSettings = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('supplier_service_provider_settings')
        .upsert({
          supplier_id: user.id,
          allow_service_providers: spSettings.allow_service_providers,
          can_edit_price: spSettings.can_edit_price,
          can_edit_stock: spSettings.can_edit_stock,
          can_edit_photos: spSettings.can_edit_photos,
          can_edit_description: spSettings.can_edit_description
        }, { onConflict: 'supplier_id' });
      
      if (error) throw error;
      toast.success('Configurações de prestadores salvas!');
    } catch (error: any) {
      console.error('Error saving SP settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Permissões</h1>
        <p className="text-muted-foreground">
          Configure quem pode vender e gerenciar seus produtos
        </p>
      </div>

      <Tabs defaultValue="affiliates" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="affiliates" className="gap-2">
            <Users className="h-4 w-4" />
            Afiliados
          </TabsTrigger>
          <TabsTrigger value="service-providers" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Prestadores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="affiliates" className="mt-6 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Programa de Afiliados</h2>
                  <p className="text-sm text-muted-foreground">
                    Permita que outros usuários vendam seus produtos
                  </p>
                </div>
              </div>
              <Switch
                checked={affiliateSettings.allow_affiliates}
                onCheckedChange={(checked) => 
                  setAffiliateSettings(prev => ({ ...prev, allow_affiliates: checked }))
                }
              />
            </div>

            {affiliateSettings.allow_affiliates && (
              <div className="space-y-6 pt-4 border-t">
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Percent className="h-4 w-4" />
                    Comissão Padrão (%)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    value={affiliateSettings.default_commission_percent}
                    onChange={(e) => 
                      setAffiliateSettings(prev => ({ 
                        ...prev, 
                        default_commission_percent: parseFloat(e.target.value) || 0 
                      }))
                    }
                    className="w-32"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Você pode definir comissões específicas por produto
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Comissão Recorrente
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Afiliados recebem comissão em todas as compras do cliente indicado
                    </p>
                  </div>
                  <Switch
                    checked={affiliateSettings.allow_recurring_commission}
                    onCheckedChange={(checked) => 
                      setAffiliateSettings(prev => ({ ...prev, allow_recurring_commission: checked }))
                    }
                  />
                </div>

                {affiliateSettings.allow_recurring_commission && (
                  <div>
                    <Label className="mb-2 block">Duração da Comissão Recorrente (meses)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="24"
                      value={affiliateSettings.recurring_duration_months}
                      onChange={(e) => 
                        setAffiliateSettings(prev => ({ 
                          ...prev, 
                          recurring_duration_months: parseInt(e.target.value) || 4 
                        }))
                      }
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 pt-4 border-t">
              <Button onClick={saveAffiliateSettings} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar Configurações
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="service-providers" className="mt-6 space-y-6">
          {/* Code Generation Panel */}
          <ServiceProviderCodePanel />
          
          {/* Requests Panel */}
          <ServiceProviderRequestsPanel />

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Permissões de Prestadores</h2>
                  <p className="text-sm text-muted-foreground">
                    Configure o que prestadores podem editar
                  </p>
                </div>
              </div>
              <Switch
                checked={spSettings.allow_service_providers}
                onCheckedChange={(checked) => 
                  setSpSettings(prev => ({ ...prev, allow_service_providers: checked }))
                }
              />
            </div>

            {spSettings.allow_service_providers && (
              <div className="space-y-4 pt-4 border-t">
                <p className="text-sm font-medium">O que prestadores podem editar:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <span>Preços</span>
                    </div>
                    <Switch
                      checked={spSettings.can_edit_price}
                      onCheckedChange={(checked) => 
                        setSpSettings(prev => ({ ...prev, can_edit_price: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <span>Estoque</span>
                    </div>
                    <Switch
                      checked={spSettings.can_edit_stock}
                      onCheckedChange={(checked) => 
                        setSpSettings(prev => ({ ...prev, can_edit_stock: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Image className="h-5 w-5 text-muted-foreground" />
                      <span>Fotos</span>
                    </div>
                    <Switch
                      checked={spSettings.can_edit_photos}
                      onCheckedChange={(checked) => 
                        setSpSettings(prev => ({ ...prev, can_edit_photos: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <span>Descrição</span>
                    </div>
                    <Switch
                      checked={spSettings.can_edit_description}
                      onCheckedChange={(checked) => 
                        setSpSettings(prev => ({ ...prev, can_edit_description: checked }))
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t">
              <Button onClick={saveSpSettings} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar Configurações
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Permissoes;