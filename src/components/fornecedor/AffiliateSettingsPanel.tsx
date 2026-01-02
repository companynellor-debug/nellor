import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Percent, 
  Calendar, 
  Save, 
  Loader2,
  Info,
  TrendingUp
} from "lucide-react";
import { useSupplierAffiliateSettings } from "@/hooks/useSupplierAffiliateSettings";
import { Skeleton } from "@/components/ui/skeleton";

export const AffiliateSettingsPanel = () => {
  const { settings, loading, saving, saveSettings } = useSupplierAffiliateSettings();
  
  const [allowAffiliates, setAllowAffiliates] = useState(false);
  const [commissionPercent, setCommissionPercent] = useState(5);
  const [durationDays, setDurationDays] = useState(120);

  useEffect(() => {
    if (settings) {
      setAllowAffiliates(settings.allow_affiliates);
      setCommissionPercent(settings.default_commission_percent);
      setDurationDays(settings.commission_duration_days);
    }
  }, [settings]);

  const handleSave = async () => {
    await saveSettings({
      allow_affiliates: allowAffiliates,
      default_commission_percent: commissionPercent,
      commission_duration_days: durationDays,
    });
  };

  const hasChanges = settings && (
    allowAffiliates !== settings.allow_affiliates ||
    commissionPercent !== settings.default_commission_percent ||
    durationDays !== settings.commission_duration_days
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Programa de Afiliados</CardTitle>
              <CardDescription>
                Configure como afiliados podem promover seus produtos
              </CardDescription>
            </div>
          </div>
          <Badge variant={allowAffiliates ? "default" : "secondary"}>
            {allowAffiliates ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="allow-affiliates" className="font-medium">
              Permitir Afiliados
            </Label>
            <p className="text-sm text-muted-foreground">
              Ative para que afiliados possam divulgar seus produtos
            </p>
          </div>
          <Switch
            id="allow-affiliates"
            checked={allowAffiliates}
            onCheckedChange={setAllowAffiliates}
          />
        </div>

        {allowAffiliates && (
          <>
            <Separator />

            {/* Commission Percentage */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <Label className="font-medium">Comissão Padrão</Label>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <Slider
                    value={[commissionPercent]}
                    onValueChange={(v) => setCommissionPercent(v[0])}
                    min={1}
                    max={50}
                    step={1}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <Input
                      type="number"
                      value={commissionPercent}
                      onChange={(e) => setCommissionPercent(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-16 text-center"
                      min={1}
                      max={50}
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>
                
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <p className="text-sm text-blue-700">
                    Afiliados receberão <strong>{commissionPercent}%</strong> do valor de cada venda.
                    Em uma venda de R$ 100, a comissão será de R$ {commissionPercent.toFixed(2).replace('.', ',')}.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Attribution Duration */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Label className="font-medium">Duração da Atribuição</Label>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <Slider
                    value={[durationDays]}
                    onValueChange={(v) => setDurationDays(v[0])}
                    min={7}
                    max={365}
                    step={1}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <Input
                      type="number"
                      value={durationDays}
                      onChange={(e) => setDurationDays(Math.min(365, Math.max(7, parseInt(e.target.value) || 7)))}
                      className="w-20 text-center"
                      min={7}
                      max={365}
                    />
                    <span className="text-muted-foreground">dias</span>
                  </div>
                </div>
                
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-100 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                  <p className="text-sm text-green-700">
                    Após o primeiro clique, <strong>todas as compras</strong> deste cliente nos próximos{" "}
                    <strong>{durationDays} dias</strong> gerarão comissão para o afiliado.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleSave} 
            disabled={saving || !hasChanges}
            className="min-w-[140px]"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
