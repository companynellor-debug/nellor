import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Store,
  TrendingUp,
  DollarSign,
  Percent,
  Calculator,
  ChevronRight,
  Check,
  Info,
  Truck,
  ShoppingCart,
  Target,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DropCatalogItem {
  product_id: string;
  product_name: string;
  product_images: string[] | null;
  product_description: string | null;
  base_price: number;
  min_resale_price?: number | null;
  max_commission_percent?: number | null;
  commission_percent: number;
  shipping_days: number;
  supplier_id: string;
  supplier_name: string;
  supplier_avatar: string | null;
  stock: number;
  allow_affiliates: boolean;
  allow_service_providers: boolean;
}

interface ProductDetailModalProps {
  product: DropCatalogItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddProduct: (customPrice: number) => Promise<void>;
  isAdding: boolean;
}

export function ProductDetailModal({
  product,
  open,
  onOpenChange,
  onAddProduct,
  isAdding,
}: ProductDetailModalProps) {
  const [customPrice, setCustomPrice] = useState<string>("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Reset state when product changes
  useMemo(() => {
    if (product) {
      const suggestedPrice = product.min_resale_price || product.base_price * 1.3;
      setCustomPrice(suggestedPrice.toFixed(2));
      setActiveImageIndex(0);
    }
  }, [product?.product_id]);

  if (!product) return null;

  const basePrice = product.base_price;
  const minResalePrice = product.min_resale_price || basePrice * 1.1;
  const maxCommission = product.max_commission_percent || 50;
  const currentPrice = parseFloat(customPrice) || 0;
  
  // Calculations
  const profit = currentPrice - basePrice;
  const marginPercent = basePrice > 0 ? ((profit / basePrice) * 100) : 0;
  const isPriceBelowMin = currentPrice < minResalePrice;
  const isValid = currentPrice >= minResalePrice && profit > 0;

  // Profit simulations
  const dailySales = [1, 5, 10, 20, 50];
  const simulations = dailySales.map((sales) => ({
    sales,
    daily: profit * sales,
    monthly: profit * sales * 30,
  }));

  const handleAdd = async () => {
    if (isValid) {
      await onAddProduct(currentPrice);
    }
  };

  const images = product.product_images || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="grid lg:grid-cols-2 gap-0">
          {/* Left: Product Images & Info */}
          <div className="bg-muted/30 p-6 space-y-4">
            {/* Main Image */}
            <div className="aspect-square rounded-xl bg-card border border-border overflow-hidden">
              {images[activeImageIndex] ? (
                <img
                  src={images[activeImageIndex]}
                  alt={product.product_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-20 w-20 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={cn(
                      "w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all",
                      activeImageIndex === idx
                        ? "border-primary"
                        : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Product Basic Info */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">
                {product.product_name}
              </h2>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Store className="h-4 w-4" />
                <span>{product.supplier_name}</span>
              </div>

              {product.product_description && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {product.product_description}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1">
                  <Package className="h-3 w-3" />
                  {product.stock} em estoque
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Truck className="h-3 w-3" />
                  Entrega em {product.shipping_days} dias
                </Badge>
                {product.allow_affiliates && (
                  <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                    Afiliados permitidos
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Right: Financial Dashboard */}
          <div className="p-6 space-y-5">
            <DialogHeader className="p-0">
              <DialogTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Calculadora de Lucro
              </DialogTitle>
            </DialogHeader>

            {/* Price Cards Grid */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-muted/50 border-border">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Preço Base</p>
                  <p className="text-lg font-bold text-foreground">
                    R$ {basePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-muted/50 border-border">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Preço Mínimo</p>
                  <p className="text-lg font-bold text-amber-600">
                    R$ {minResalePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Price Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center justify-between">
                <span>Seu Preço de Venda</span>
                {isPriceBelowMin && (
                  <span className="text-xs text-destructive flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Abaixo do mínimo
                  </span>
                )}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  R$
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min={minResalePrice}
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className={cn(
                    "pl-12 text-xl font-bold h-14 text-center",
                    isPriceBelowMin && "border-destructive focus-visible:ring-destructive"
                  )}
                />
              </div>
            </div>

            {/* Live Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <Card className={cn(
                "border-2",
                isValid ? "bg-green-500/10 border-green-500/30" : "bg-muted/50 border-border"
              )}>
                <CardContent className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Lucro por Venda</p>
                  </div>
                  <p className={cn(
                    "text-2xl font-bold",
                    profit > 0 ? "text-green-600" : "text-destructive"
                  )}>
                    R$ {profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>

              <Card className={cn(
                "border-2",
                isValid ? "bg-green-500/10 border-green-500/30" : "bg-muted/50 border-border"
              )}>
                <CardContent className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Percent className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Margem</p>
                  </div>
                  <p className={cn(
                    "text-2xl font-bold",
                    marginPercent > 0 ? "text-green-600" : "text-destructive"
                  )}>
                    {marginPercent.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Profit Simulation */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-foreground text-sm">
                  Simulação de Ganhos
                </h4>
              </div>

              <div className="bg-muted/30 rounded-xl p-3 space-y-2">
                <div className="grid grid-cols-3 text-xs text-muted-foreground font-medium pb-2 border-b border-border">
                  <span>Vendas/Dia</span>
                  <span className="text-center">Lucro Diário</span>
                  <span className="text-right">Lucro Mensal</span>
                </div>

                {simulations.map((sim) => (
                  <div
                    key={sim.sales}
                    className="grid grid-cols-3 text-sm py-1.5"
                  >
                    <span className="text-foreground font-medium flex items-center gap-1">
                      <ShoppingCart className="h-3 w-3 text-muted-foreground" />
                      {sim.sales} vendas
                    </span>
                    <span className={cn(
                      "text-center font-medium",
                      sim.daily > 0 ? "text-green-600" : "text-muted-foreground"
                    )}>
                      R$ {sim.daily.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                    <span className={cn(
                      "text-right font-bold",
                      sim.monthly > 0 ? "text-green-600" : "text-muted-foreground"
                    )}>
                      R$ {sim.monthly.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Button */}
            <Button
              onClick={handleAdd}
              disabled={!isValid || isAdding}
              className="w-full h-12 text-base"
              size="lg"
            >
              {isAdding ? (
                "Adicionando..."
              ) : (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Adicionar ao Meu Catálogo
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>

            {!isValid && (
              <p className="text-xs text-center text-muted-foreground">
                {isPriceBelowMin
                  ? `O preço mínimo de revenda é ${formatCurrency(minResalePrice)}`
                  : "Configure um preço válido para continuar"}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
