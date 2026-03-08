import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, Truck, MapPin, Package } from "lucide-react";
import { useSupplierShipping, ShippingRegion, REGION_LABELS } from "@/hooks/useSupplierShipping";
import { CurrencyInput, decimalToCents, centsToDecimal } from "@/utils/currency";
import { Skeleton } from "@/components/ui/skeleton";

interface ShippingConfigTabProps {
  supplierId: string;
}

const REGION_STATES: Record<ShippingRegion, string> = {
  norte: 'AC, AP, AM, PA, RO, RR, TO',
  nordeste: 'AL, BA, CE, MA, PB, PE, PI, RN, SE',
  centro_oeste: 'DF, GO, MT, MS',
  sudeste: 'ES, MG, RJ, SP',
  sul: 'PR, RS, SC',
};

export const ShippingConfigTab = ({ supplierId }: ShippingConfigTabProps) => {
  const { configs, loading, updateConfig, saveConfigs, allRegions } = useSupplierShipping(supplierId);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Configurar Frete por Região
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Defina preços de entrega para cada região do Brasil. Regiões desativadas não receberão pedidos.
          </p>
        </div>
        <Button onClick={saveConfigs} className="gap-2">
          <Save className="h-4 w-4" />
          Salvar Frete
        </Button>
      </div>

      <div className="space-y-4">
        {allRegions.map(({ key }) => {
          const config = configs.find(c => c.region === key)!;
          return (
            <Card key={key} className={`p-5 transition-all ${config.enabled ? 'border-primary/30 bg-primary/5' : 'opacity-60'}`}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <MapPin className={`h-5 w-5 ${config.enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <h3 className="font-semibold">{REGION_LABELS[key]}</h3>
                    <p className="text-xs text-muted-foreground">{REGION_STATES[key]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`toggle-${key}`} className="text-sm">
                    {config.enabled ? 'Ativo' : 'Inativo'}
                  </Label>
                  <Switch
                    id={`toggle-${key}`}
                    checked={config.enabled}
                    onCheckedChange={(checked) => updateConfig(key, { enabled: checked })}
                  />
                </div>
              </div>

              {config.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Preço do Frete</Label>
                    <CurrencyInput
                      value={decimalToCents(config.price)}
                      onChange={(cents) => updateConfig(key, { price: centsToDecimal(cents) })}
                      placeholder="R$ 0,00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Frete Grátis acima de</Label>
                    <CurrencyInput
                      value={config.free_above ? decimalToCents(config.free_above) : 0}
                      onChange={(cents) => updateConfig(key, { free_above: cents > 0 ? centsToDecimal(cents) : null })}
                      placeholder="R$ 0,00 (opcional)"
                    />
                    <p className="text-[10px] text-muted-foreground">Deixe R$ 0,00 para não oferecer frete grátis</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Retirada na fonte</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Switch
                        checked={config.allows_pickup}
                        onCheckedChange={(checked) => updateConfig(key, { allows_pickup: checked })}
                      />
                      <span className="text-sm text-muted-foreground">
                        {config.allows_pickup ? 'Permitida' : 'Não permitida'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={saveConfigs} className="gap-2" size="lg">
          <Save className="h-4 w-4" />
          Salvar Configurações de Frete
        </Button>
      </div>
    </div>
  );
};
