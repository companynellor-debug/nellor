import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { ProductFormData, SALE_TYPE_CONFIG, PriceTierForm } from './types';
import { CurrencyInput, formatCurrencyFromDecimal, centsToDecimal } from '@/utils/currency';

interface Props {
  data: ProductFormData;
  onChange: (updates: Partial<ProductFormData>) => void;
  hasVariations?: boolean;
}

export default function PricingStep({ data, onChange, hasVariations }: Props) {
  const config = SALE_TYPE_CONFIG[data.saleType];
  const unitLabel = config.unitLabelPlural;
  const isSingularLabel = config.unitLabel;
  const isBox = data.saleType === 'closed_box';
  const isBale = data.saleType === 'bale';
  const unitsPerBox = parseInt(data.unitsPerBox) || 0;
  const baleWeight = parseFloat(data.baleWeightKg) || 0;

  const tiers = data.priceTiers;
  const setTiers = (newTiers: PriceTierForm[]) => onChange({ priceTiers: newTiers });

  const addTier = () => {
    const last = tiers[tiers.length - 1];
    const nextMin = last?.maxQty ? (parseInt(last.maxQty) + 1).toString() : '';
    setTiers([...tiers, { minQty: nextMin, maxQty: '', priceCents: 0 }]);
  };

  const removeTier = (idx: number) => {
    if (tiers.length <= 1) return;
    setTiers(tiers.filter((_, i) => i !== idx));
  };

  const updateTier = (idx: number, field: string, value: string | number) => {
    setTiers(tiers.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  const formatTierPreview = (tier: PriceTierForm) => {
    if (!tier.priceCents) return null;
    const price = centsToDecimal(tier.priceCents);
    const range = `${tier.minQty}${tier.maxQty ? ` - ${tier.maxQty}` : '+'}`;

    if (isBox && unitsPerBox > 0) {
      const minUnits = (parseInt(tier.minQty) || 1) * unitsPerBox;
      const maxUnits = tier.maxQty ? parseInt(tier.maxQty) * unitsPerBox : null;
      const unitPrice = price / unitsPerBox;
      return (
        <div className="text-xs">
          <span>De {range} caixas ({minUnits} a {maxUnits || '∞'} unidades): </span>
          <span className="font-semibold text-primary">{formatCurrencyFromDecimal(price)}/caixa</span>
          <span className="text-muted-foreground"> / {formatCurrencyFromDecimal(unitPrice)}/un</span>
        </div>
      );
    }

    if (isBale && baleWeight > 0) {
      const pricePerKg = price / baleWeight;
      return (
        <div className="text-xs">
          <span>De {range} fardos: </span>
          <span className="font-semibold text-primary">{formatCurrencyFromDecimal(price)}/fardo</span>
          <span className="text-muted-foreground"> / ~{formatCurrencyFromDecimal(pricePerKg)}/kg</span>
        </div>
      );
    }

    return (
      <div className="flex justify-between text-xs">
        <span>{range} {unitLabel}</span>
        <span className="font-semibold text-primary">{formatCurrencyFromDecimal(price)}/{isSingularLabel}</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Pedido mínimo em {unitLabel} *</Label>
          <Input type="number" min="1" value={data.minOrderQuantity} onChange={(e) => onChange({ minOrderQuantity: e.target.value })} />
        </div>
        <div>
          <Label>Pedido máximo <span className="text-xs text-muted-foreground">(opcional)</span></Label>
          <Input type="number" min="1" value={data.maxOrderQuantity} onChange={(e) => onChange({ maxOrderQuantity: e.target.value })} placeholder="Sem limite" />
        </div>
      </div>

      <div>
        <Label>Estoque {hasVariations ? '(calculado pelas variações)' : `em ${unitLabel}`}</Label>
        <Input type="number" value={data.stock} onChange={(e) => onChange({ stock: e.target.value })} placeholder="0" disabled={hasVariations} />
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={data.isCnpjOnly} onCheckedChange={(v) => onChange({ isCnpjOnly: v })} />
        <Label className="text-sm">Vende apenas para CNPJ</Label>
      </div>

      {/* Price Tiers */}
      <div className="border-t pt-3 space-y-3">
        <Label className="font-semibold">💰 Faixas de preço por quantidade de {unitLabel} *</Label>
        {tiers.map((tier, idx) => (
          <div key={idx} className="flex items-end gap-2 bg-muted/30 rounded-lg p-3">
            <div className="flex-1">
              <Label className="text-xs">Mín ({unitLabel})</Label>
              <Input type="number" min="1" value={tier.minQty} onChange={(e) => updateTier(idx, 'minQty', e.target.value)} className="h-9" />
            </div>
            <div className="flex-1">
              <Label className="text-xs">Máx ({unitLabel})</Label>
              <Input type="number" min="1" value={tier.maxQty} onChange={(e) => updateTier(idx, 'maxQty', e.target.value)} placeholder="∞" className="h-9" />
            </div>
            <div className="flex-1">
              <Label className="text-xs">Preço/{isSingularLabel} (R$)</Label>
              <CurrencyInput value={tier.priceCents} onChange={(cents) => updateTier(idx, 'priceCents', cents)} placeholder="R$ 0,00" />
            </div>
            {tiers.length > 1 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => removeTier(idx)} className="h-9 px-2">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addTier} className="gap-1">
          <Plus className="h-3 w-3" /> Adicionar Faixa
        </Button>

        {/* Preview */}
        {tiers.some(t => t.priceCents > 0) && (
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
            <p className="text-xs font-semibold mb-2">📊 Preview — como o cliente vai ver:</p>
            <div className="space-y-1.5">
              {tiers.filter(t => t.priceCents > 0).map((t, idx) => (
                <div key={idx}>{formatTierPreview(t)}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
