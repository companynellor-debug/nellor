import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  DollarSign,
  Percent,
  Save,
  Truck,
  Users,
  TrendingUp,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProductWithDrop {
  id: string;
  nome: string;
  preco: number;
  imagens: string[] | null;
  estoque: number;
  dropSetting: {
    id: string;
    drop_enabled: boolean;
    commission_percent: number;
    min_resale_price: number | null;
    max_commission_percent: number | null;
    allow_affiliates: boolean;
    allow_service_providers: boolean;
    shipping_days_estimate: number;
  } | null;
}

interface SupplierProductDropModalProps {
  product: ProductWithDrop | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (productId: string, settings: Record<string, unknown>) => Promise<void>;
  isSaving: boolean;
}

export function SupplierProductDropModal({
  product,
  open,
  onOpenChange,
  onSave,
  isSaving,
}: SupplierProductDropModalProps) {
  const [dropEnabled, setDropEnabled] = useState(false);
  const [minResalePrice, setMinResalePrice] = useState("");
  const [maxCommission, setMaxCommission] = useState("50");
  const [commissionPercent, setCommissionPercent] = useState("10");
  const [shippingDays, setShippingDays] = useState("7");
  const [allowAffiliates, setAllowAffiliates] = useState(true);
  const [allowServiceProviders, setAllowServiceProviders] = useState(true);

  // Initialize state when product changes
  useState(() => {
    if (product) {
      const ds = product.dropSetting;
      setDropEnabled(ds?.drop_enabled || false);
      setMinResalePrice(ds?.min_resale_price?.toString() || (product.preco * 1.2).toFixed(2));
      setMaxCommission(ds?.max_commission_percent?.toString() || "50");
      setCommissionPercent(ds?.commission_percent?.toString() || "10");
      setShippingDays(ds?.shipping_days_estimate?.toString() || "7");
      setAllowAffiliates(ds?.allow_affiliates ?? true);
      setAllowServiceProviders(ds?.allow_service_providers ?? true);
    }
  });

  if (!product) return null;

  const basePrice = product.preco;
  const minPrice = parseFloat(minResalePrice) || basePrice * 1.2;
  const suggestedResalePrice = basePrice * 1.3;
  const potentialMargin = suggestedResalePrice - basePrice;

  const handleSave = async () => {
    try {
      await onSave(product.id, {
        drop_enabled: dropEnabled,
        min_resale_price: parseFloat(minResalePrice) || null,
        max_commission_percent: parseFloat(maxCommission) || 50,
        commission_percent: parseFloat(commissionPercent) || 10,
        shipping_days_estimate: parseInt(shippingDays) || 7,
        allow_affiliates: allowAffiliates,
        allow_service_providers: allowServiceProviders,
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Configurações Drop do Produto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info */}
          <div className="flex gap-4 p-4 bg-muted/50 rounded-xl">
            <div className="h-20 w-20 rounded-lg bg-card overflow-hidden flex-shrink-0 border border-border">
              {product.imagens?.[0] ? (
                <img
                  src={product.imagens[0]}
                  alt={product.nome}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{product.nome}</h3>
              <p className="text-muted-foreground text-sm">Estoque: {product.estoque} unidades</p>
              <p className="text-lg font-bold text-foreground mt-1">
                R$ {basePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Enable Drop Toggle */}
          <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
            <div>
              <p className="font-medium text-foreground">Disponibilizar no Nellor Drop</p>
              <p className="text-sm text-muted-foreground">
                Permite que revendedores vendam este produto
              </p>
            </div>
            <Switch
              checked={dropEnabled}
              onCheckedChange={setDropEnabled}
            />
          </div>

          {dropEnabled && (
            <>
              <Separator />

              {/* Pricing Settings */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Configurações de Preço
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-muted/30 border-border">
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-muted-foreground">Preço Base</p>
                      <p className="text-lg font-bold text-foreground">
                        R$ {basePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </CardContent>
                  </Card>

                  <div className="space-y-2">
                    <Label className="text-sm">Preço Mínimo de Revenda</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        R$
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        value={minResalePrice}
                        onChange={(e) => setMinResalePrice(e.target.value)}
                        className="pl-10"
                        placeholder={`Min: ${(basePrice * 1.1).toFixed(2)}`}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Revendedores não poderão vender abaixo deste valor
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Comissão Padrão (%)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={commissionPercent}
                        onChange={(e) => setCommissionPercent(e.target.value)}
                        className="pr-8"
                      />
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Comissão Máxima (%)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={maxCommission}
                        onChange={(e) => setMaxCommission(e.target.value)}
                        className="pr-8"
                      />
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Margem máxima permitida para revendedores
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className="h-4 w-4 text-green-600" />
                    <h5 className="font-medium text-foreground">Visualização no Catálogo</h5>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Preço Base</p>
                      <p className="font-bold text-foreground">
                        R$ {basePrice.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Mínimo Revenda</p>
                      <p className="font-bold text-amber-600">
                        R$ {minPrice.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Lucro Potencial</p>
                      <p className="font-bold text-green-600">
                        R$ {potentialMargin.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {/* Additional Settings */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" />
                  Configurações Adicionais
                </h4>

                <div className="space-y-2">
                  <Label className="text-sm">Prazo de Entrega Estimado (dias)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={shippingDays}
                    onChange={(e) => setShippingDays(e.target.value)}
                    className="max-w-[120px]"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">Permitir Afiliados</span>
                    </div>
                    <Switch
                      checked={allowAffiliates}
                      onCheckedChange={setAllowAffiliates}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">Permitir Prestadores</span>
                    </div>
                    <Switch
                      checked={allowServiceProviders}
                      onCheckedChange={setAllowServiceProviders}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full"
            size="lg"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
