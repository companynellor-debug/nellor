import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';
import { ProductVariation } from '@/hooks/useProductVariations';
import { formatCurrencyFromDecimal } from '@/utils/currency';
import { getColorHex } from '@/utils/colorMap';

interface BulkOrderGridProps {
  variations: ProductVariation[];
  basePrice: number;
  minQuantity?: number;
  onAddToCart: (items: Array<{ color: string; colorHex: string; size: string; quantity: number; price: number; imageUrl: string }>) => void;
}

export const BulkOrderGrid = ({ variations, basePrice, minQuantity, onAddToCart }: BulkOrderGridProps) => {
  const uniqueColors = useMemo(() => {
    const seen = new Map<string, { hex: string; imageUrl: string }>();
    variations.filter(v => v.color).forEach(v => {
      if (!seen.has(v.color!)) seen.set(v.color!, { hex: v.color_hex || '', imageUrl: v.image_url || '' });
    });
    return Array.from(seen.entries()).map(([name, data]) => ({ name, ...data }));
  }, [variations]);

  const uniqueSizes = useMemo(() => [...new Set(variations.filter(v => v.size).map(v => v.size!))], [variations]);

  // qty grid: { "color:size": quantity }
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const getVariation = (color: string, size: string) => {
    return variations.find(v => v.color === color && v.size === size);
  };

  const getKey = (color: string, size: string) => `${color}:${size}`;

  const setQty = (color: string, size: string, qty: number) => {
    const v = getVariation(color, size);
    const maxStock = v?.stock ?? 0;
    const clamped = Math.max(0, Math.min(qty, maxStock));
    setQuantities(prev => ({ ...prev, [getKey(color, size)]: clamped }));
  };

  const totalPieces = Object.values(quantities).reduce((s, q) => s + q, 0);
  const totalValue = useMemo(() => {
    let total = 0;
    Object.entries(quantities).forEach(([key, qty]) => {
      if (qty <= 0) return;
      const [color, size] = key.split(':');
      const v = getVariation(color, size);
      total += (v?.price ?? basePrice) * qty;
    });
    return total;
  }, [quantities, variations, basePrice]);

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
        price: v?.price ?? basePrice, imageUrl: colorData?.imageUrl || '',
      });
    });
    onAddToCart(items);
  };

  // Handle case: sizes only (no colors)
  if (uniqueColors.length === 0 && uniqueSizes.length > 0) {
    return (
      <div className="space-y-4 bg-muted/30 rounded-xl p-4">
        <h3 className="font-semibold text-sm">📦 Pedido em Massa</h3>
        <div className="flex flex-wrap gap-3">
          {uniqueSizes.map(size => {
            const v = variations.find(vr => vr.size === size && !vr.color);
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
        <SummaryBar totalPieces={totalPieces} totalValue={totalValue} meetsMinimum={meetsMinimum} minQuantity={minQuantity} onAdd={handleAddToCart} />
      </div>
    );
  }

  // Full grid: colors x sizes
  if (uniqueColors.length === 0 || uniqueSizes.length === 0) return null;

  return (
    <div className="space-y-4 bg-muted/30 rounded-xl p-4">
      <h3 className="font-semibold text-sm">📦 Pedido em Massa</h3>
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
                    <div className="w-5 h-5 rounded-full border border-border flex-shrink-0"
                      style={{ backgroundColor: color.hex || colorNameToHex(color.name) || '#ccc' }} />
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
      <SummaryBar totalPieces={totalPieces} totalValue={totalValue} meetsMinimum={meetsMinimum} minQuantity={minQuantity} onAdd={handleAddToCart} />
    </div>
  );
};

const SummaryBar = ({ totalPieces, totalValue, meetsMinimum, minQuantity, onAdd }: {
  totalPieces: number; totalValue: number; meetsMinimum: boolean; minQuantity?: number; onAdd: () => void;
}) => (
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-border">
    <div className="space-y-1">
      <p className="text-sm"><span className="font-semibold">{totalPieces}</span> peças selecionadas</p>
      <p className="text-lg font-bold text-primary">{formatCurrencyFromDecimal(totalValue)}</p>
      {!meetsMinimum && minQuantity && (
        <p className="text-xs text-destructive">Mínimo de {minQuantity} unidades para este produto</p>
      )}
    </div>
    <Button onClick={onAdd} disabled={totalPieces === 0 || !meetsMinimum} className="gap-2">
      <ShoppingCart className="h-4 w-4" />
      Adicionar ao Carrinho
    </Button>
  </div>
);
