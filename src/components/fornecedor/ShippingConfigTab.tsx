import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, Truck, MapPin, Package, Loader2, CheckCircle } from "lucide-react";
import { useSupplierShipping, ShippingRegion, REGION_LABELS } from "@/hooks/useSupplierShipping";
import { CurrencyInput, decimalToCents, centsToDecimal } from "@/utils/currency";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCep, fetchAddressByCep } from "@/utils/viaCep";

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
  const { configs, shippingConfig, loading, updateConfig, updateShippingConfig, saveConfigs, allRegions } = useSupplierShipping(supplierId);
  const [cepLoading, setCepLoading] = useState(false);

  const handleCepChange = async (value: string) => {
    const formatted = formatCep(value);
    updateShippingConfig({ origin_cep: formatted });

    const clean = formatted.replace(/\D/g, '');
    if (clean.length === 8) {
      setCepLoading(true);
      const result = await fetchAddressByCep(clean);
      setCepLoading(false);
      if (result) {
        updateShippingConfig({
          origin_city: result.localidade,
          origin_state: result.uf,
        });
      }
    }
  };

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
            Configurar Frete
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure origem, modalidade e preços de entrega.
          </p>
        </div>
        <Button onClick={saveConfigs} className="gap-2">
          <Save className="h-4 w-4" />
          Salvar
        </Button>
      </div>

      {/* Seção 1: Origem */}
      <Card className="p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Origem dos Envios
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium">CEP de Origem</Label>
            <div className="relative">
              <Input
                value={shippingConfig.origin_cep}
                onChange={(e) => handleCepChange(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
              />
              {cepLoading && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium">Cidade</Label>
            <Input
              value={shippingConfig.origin_city}
              onChange={(e) => updateShippingConfig({ origin_city: e.target.value })}
              placeholder="Cidade"
              className="bg-muted"
              readOnly
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium">Estado</Label>
            <Input
              value={shippingConfig.origin_state}
              onChange={(e) => updateShippingConfig({ origin_state: e.target.value })}
              placeholder="UF"
              className="bg-muted"
              readOnly
            />
          </div>
        </div>
      </Card>

      {/* Seção 2: Modalidade */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Modalidade de Frete</h3>
          <div className="flex items-center gap-2">
            <Label htmlFor="melhor-envio" className="text-sm">
              Usar Melhor Envio
            </Label>
            <Switch
              id="melhor-envio"
              checked={shippingConfig.use_melhor_envio}
              onCheckedChange={(checked) => updateShippingConfig({ use_melhor_envio: checked })}
            />
          </div>
        </div>

        {shippingConfig.use_melhor_envio ? (
          <div className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Melhor Envio Ativado</p>
            </div>
            <p className="text-xs text-muted-foreground">
              O frete será calculado automaticamente por peso e CEP via API do Melhor Envio.
            </p>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Token da API Melhor Envio</Label>
              <Input
                value={shippingConfig.melhor_envio_token}
                onChange={(e) => updateShippingConfig({ melhor_envio_token: e.target.value })}
                placeholder="Cole aqui o token da API"
                type="password"
              />
              <p className="text-[10px] text-muted-foreground">
                Obtenha em melhorenvio.com.br → Painel → Integrações → Tokens
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure preços e prazos manualmente para cada região do Brasil. Regiões desativadas não receberão pedidos.
            </p>

            {allRegions.map(({ key }) => {
              const config = configs.find(c => c.region === key)!;
              return (
                <Card key={key} className={`p-4 transition-all ${config.enabled ? 'border-primary/30 bg-primary/5' : 'opacity-60'}`}>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <MapPin className={`h-4 w-4 ${config.enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <h4 className="font-semibold text-sm">{REGION_LABELS[key]}</h4>
                        <p className="text-[10px] text-muted-foreground">{REGION_STATES[key]}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`toggle-${key}`} className="text-xs">
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
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium">Preço do Frete</Label>
                        <CurrencyInput
                          value={decimalToCents(config.price)}
                          onChange={(cents) => updateConfig(key, { price: centsToDecimal(cents) })}
                          placeholder="R$ 0,00"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium">Frete Grátis acima de</Label>
                        <CurrencyInput
                          value={config.free_above ? decimalToCents(config.free_above) : 0}
                          onChange={(cents) => updateConfig(key, { free_above: cents > 0 ? centsToDecimal(cents) : null })}
                          placeholder="R$ 0,00"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium">Prazo (dias)</Label>
                        <div className="flex gap-1 items-center">
                          <Input
                            type="number"
                            min={1}
                            max={90}
                            value={config.delivery_days_min}
                            onChange={(e) => updateConfig(key, { delivery_days_min: Number(e.target.value) || 1 })}
                            className="w-14 text-center text-xs h-9"
                          />
                          <span className="text-xs text-muted-foreground">a</span>
                          <Input
                            type="number"
                            min={1}
                            max={90}
                            value={config.delivery_days_max}
                            onChange={(e) => updateConfig(key, { delivery_days_max: Number(e.target.value) || 1 })}
                            className="w-14 text-center text-xs h-9"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium">Retirada</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Switch
                            checked={config.allows_pickup}
                            onCheckedChange={(checked) => updateConfig(key, { allows_pickup: checked })}
                          />
                          <span className="text-[10px] text-muted-foreground">
                            {config.allows_pickup ? 'Sim' : 'Não'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      {/* Seção 3: Frete Grátis Global */}
      <Card className="p-5 space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          Frete Grátis Global
        </h3>
        <p className="text-sm text-muted-foreground">
          Se preenchido, frete será zerado automaticamente quando o pedido ultrapassar este valor.
        </p>
        <div className="max-w-xs">
          <Label className="text-xs font-medium">Frete grátis acima de</Label>
          <CurrencyInput
            value={shippingConfig.free_shipping_above ? decimalToCents(shippingConfig.free_shipping_above) : 0}
            onChange={(cents) => updateShippingConfig({ free_shipping_above: cents > 0 ? centsToDecimal(cents) : null })}
            placeholder="R$ 0,00 (opcional)"
          />
          <p className="text-[10px] text-muted-foreground mt-1">Deixe R$ 0,00 para não oferecer</p>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveConfigs} className="gap-2" size="lg">
          <Save className="h-4 w-4" />
          Salvar Configurações de Frete
        </Button>
      </div>
    </div>
  );
};
