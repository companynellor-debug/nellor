import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, AlertTriangle } from 'lucide-react';
import { ProductVariation } from '@/hooks/useProductVariations';
import { PriceTier } from '@/hooks/useProductPriceTiers';
import { formatCurrencyFromDecimal } from '@/utils/currency';
import { getColorHex } from '@/utils/colorMap';

interface BulkOrderGridProps {
  variations: ProductVariation[];
  basePrice: number;
  minQuantity?: number;
  priceTiers?: PriceTier[];
  onAddToCart: (items: Array<{ color: string; colorHex: string; size: string; quantity: number; price: number; imageUrl: string }>) => void;
}

export const BulkOrderGrid = ({ variations, basePrice, minQuantity, priceTiers = [], onAddToCart }: BulkOrderGridProps) => {
  const uniqueColors = useMemo(() => {
    const seen = new Map<string, { hex: string; imageUrl: string }>();
    variations.filter(v => v.color).forEach(v => {
      if (!seen.has(v.color!)) seen.set(v.color!, { hex: v.color_hex || '', imageUrl: v.image_url || '' });
    });
    return Array.from(seen.entries()).map(([name, data]) => ({ name, ...data }));
  }, [variations]);

  const uniqueSizes = useMemo(() => {
    const vals = variations.filter(v => v.variation_value || v.size).map(v => v.variation_value || v.size!);
    return [...new Set(vals)];
  }, [variations]);

  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const getVariation = (color: string, size: string) => {
    return variations.find(v => v.color === color && (v.variation_value === size || v.size === size));
  };

  const getKey = (color: string, size: string) => `${color}:${size}`;

  const setQty = (color: string, size: string, qty: number) => {
    const v = getVariation(color, size);
    const maxStock = v?.stock ?? 0;
    const clamped = Math.max(0, Math.min(qty, maxStock));
    setQuantities(prev => ({ ...prev, [getKey(color, size)]: clamped }));
  };

  const totalPieces = Object.values(quantities).reduce((s, q) => s + q, 0);

  // Find applicable tier
  const getApplicableTier = (qty: number): PriceTier | null => {
    if (!priceTiers.length) return null;
    const sorted = [...priceTiers].sort((a, b) => b.min_quantity - a.min_quantity);
    return sorted.find(t => qty >= t.min_quantity && (t.max_quantity === null || qty <= t.max_quantity)) || null;
  };

  const currentTier = getApplicableTier(totalPieces);
  const unitPrice = currentTier ? currentTier.price_per_unit : basePrice;

  const totalValue = useMemo(() => {
    let total = 0;
    Object.entries(quantities).forEach(([key, qty]) => {
      if (qty <= 0) return;
      const [color, size] = key.split(':');
      const v = getVariation(color, size);
      const price = v?.price ?? unitPrice;
      total += price * qty;
    });
    return total;
  }, [quantities, variations, unitPrice]);

  const meetsMinimum = !minQuantity || totalPieces >= minQuantity;

  const handleAddToCart = () => {
    const items: Array<{ color: string; colorHex: string; size: string; quantity: number; price: number; imageUrl: string }> = [];
    Object.entries(quantities).forEach(([key, qty]) => {
      if (qty <= 0) return;
      const [color, size] = key.split(':');
      const v = getVariation(color, size);
      const colorData = uniqueColors.find(c => c.name === color);
      items.push({
        color, colorHex: colorData?.hex || '', size, quantity: qty,
        price: v?.price ?? unitPrice, imageUrl: colorData?.imageUrl || '',
      });
    });
    onAddToCart(items);
  };

  // Sizes only (no colors)
  if (uniqueColors.length === 0 && uniqueSizes.length > 0) {
    return (
      <div className="space-y-4 bg-muted/30 rounded-xl p-4">
        <h3 className="font-semibold text-sm">📦 Pedido em Massa</h3>
        <div className="flex flex-wrap gap-3">
          {uniqueSizes.map(size => {
            const v = variations.find(vr => (vr.variation_value === size || vr.size === size) && !vr.color);
            const stock = v?.stock ?? 0;
            return (
              <div key={size} className="flex flex-col items-center gap-1">
                <Badge variant="outline" className="text-xs">{size}</Badge>
                <Input type="number" min="0" max={stock} className="w-16 h-8 text-center text-xs"
                  value={quantities[`:${size}`] || 0}
                  onChange={e => setQty('', size, parseInt(e.target.value) || 0)}
                  disabled={stock === 0} />
                <span className="text-[10px] text-muted-foreground">{stock} disp.</span>
              </div>
            );
          })}
        </div>
        {priceTiers.length > 0 && <PriceTierTable tiers={priceTiers} currentQty={totalPieces} />}
        <SummaryBar totalPieces={totalPieces} totalValue={totalValue} meetsMinimum={meetsMinimum}
          minQuantity={minQuantity} unitPrice={unitPrice} tierLabel={currentTier ? `${currentTier.min_quantity}${currentTier.max_quantity ? `-${currentTier.max_quantity}` : '+'} un` : null}
          onAdd={handleAddToCart} />
      </div>
    );
  }

  if (uniqueColors.length === 0 || uniqueSizes.length === 0) return null;

  return (
    <div className="space-y-4 bg-muted/30 rounded-xl p-4">
      <h3 className="font-semibold text-sm">📦 Pedido em Massa</h3>

      {priceTiers.length > 0 && <PriceTierTable tiers={priceTiers} currentQty={totalPieces} />}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2 text-xs font-medium text-muted-foreground">Cor</th>
              {uniqueSizes.map(s => (
                <th key={s} className="text-center p-2 text-xs font-medium text-muted-foreground">{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {uniqueColors.map(color => (
              <tr key={color.name} className="border-b border-border/50">
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    {color.imageUrl ? (
                      <img src={color.imageUrl} alt={color.name} className="w-6 h-6 rounded object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-border flex-shrink-0"
                        style={{ backgroundColor: color.hex || getColorHex(color.name) || '#ccc' }} />
                    )}
                    <span className="text-xs font-medium">{color.name}</span>
                  </div>
                </td>
                {uniqueSizes.map(size => {
                  const v = getVariation(color.name, size);
                  const stock = v?.stock ?? 0;
                  return (
                    <td key={size} className="p-1 text-center">
                      <Input type="number" min="0" max={stock}
                        className={`w-14 h-8 text-center text-xs mx-auto ${stock === 0 ? 'bg-muted opacity-50' : ''}`}
                        value={quantities[getKey(color.name, size)] || 0}
                        onChange={e => setQty(color.name, size, parseInt(e.target.value) || 0)}
                        disabled={stock === 0} />
                      {stock === 0 && <span className="text-[9px] text-destructive">Esgotado</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SummaryBar totalPieces={totalPieces} totalValue={totalValue} meetsMinimum={meetsMinimum}
        minQuantity={minQuantity} unitPrice={unitPrice} tierLabel={currentTier ? `${currentTier.min_quantity}${currentTier.max_quantity ? `-${currentTier.max_quantity}` : '+'} un` : null}
        onAdd={handleAddToCart} />
    </div>
  );
};

const PriceTierTable = ({ tiers, currentQty }: { tiers: PriceTier[]; currentQty: number }) => (
  <div className="bg-background rounded-lg p-3 border">
    <p className="text-xs font-semibold mb-2">💰 Tabela de Preços Regressivos</p>
    <div className="space-y-1">
      {tiers.map((t, idx) => {
        const isActive = currentQty >= t.min_quantity && (t.max_quantity === null || currentQty <= t.max_quantity);
        return (
          <div key={idx} className={`flex justify-between text-xs px-2 py-1 rounded ${isActive ? 'bg-primary/10 text-primary font-semibold' : ''}`}>
            <span>{t.min_quantity}{t.max_quantity ? ` - ${t.max_quantity}` : '+'} unid.</span>
            <span>{formatCurrencyFromDecimal(t.price_per_unit)}/un</span>
          </div>
        );
      })}
    </div>
  </div>
);

const SummaryBar = ({ totalPieces, totalValue, meetsMinimum, minQuantity, unitPrice, tierLabel, onAdd }: {
  totalPieces: number; totalValue: number; meetsMinimum: boolean; minQuantity?: number; unitPrice: number; tierLabel: string | null; onAdd: () => void;
}) => (
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-border">
    <div className="space-y-1">
      <p className="text-sm"><span className="font-semibold">{totalPieces}</span> peças selecionadas</p>
      {tierLabel && <p className="text-xs text-primary">Faixa aplicada: {tierLabel} — {formatCurrencyFromDecimal(unitPrice)}/un</p>}
      <p className="text-lg font-bold text-primary">{formatCurrencyFromDecimal(totalValue)}</p>
      {!meetsMinimum && minQuantity && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> Mínimo de {minQuantity} unidades para este produto
        </p>
      )}
    </div>
    <Button onClick={onAdd} disabled={totalPieces === 0 || !meetsMinimum} className="gap-2">
      <ShoppingCart className="h-4 w-4" />
      Adicionar ao Carrinho
    </Button>
  </div>
);
