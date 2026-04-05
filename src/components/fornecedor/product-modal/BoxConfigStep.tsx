import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProductFormData } from './types';
import { useEffect } from 'react';

interface Props {
  data: ProductFormData;
  onChange: (updates: Partial<ProductFormData>) => void;
}

export default function BoxConfigStep({ data, onChange }: Props) {
  const unitWeight = parseFloat(data.weightGrams) || 0;
  const unitsPerBox = parseInt(data.unitsPerBox) || 0;

  // Auto-calculate box weight from unit weight × quantity
  useEffect(() => {
    if (unitWeight > 0 && unitsPerBox > 0) {
      const autoKg = ((unitWeight * unitsPerBox) / 1000).toFixed(2);
      if (data.boxWeightKg !== autoKg) {
        onChange({ boxWeightKg: autoKg });
      }
    }
  }, [unitWeight, unitsPerBox]);

  return (
    <div className="space-y-5">
      <h3 className="font-semibold text-lg">📦 Configuração da Caixa</h3>

      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
        <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
          ⚠️ Na Nellor, todos os produtos dentro da caixa devem ser idênticos. Cada variação de cor, tamanho ou configuração deve ser cadastrada como uma caixa separada.
        </p>
      </div>

      <div>
        <Label>Quantidade de unidades por caixa *</Label>
        <Input
          type="number"
          min="1"
          value={data.unitsPerBox}
          onChange={(e) => onChange({ unitsPerBox: e.target.value })}
          placeholder="Ex: 12"
        />
        {data.unitsPerBox && parseInt(data.unitsPerBox) === 0 && (
          <p className="text-xs text-destructive mt-1">A quantidade por caixa não pode ser 0</p>
        )}
      </div>

      <div>
        <Label>
          Peso total da caixa (kg)
          {unitWeight > 0 && unitsPerBox > 0 && (
            <span className="text-xs text-muted-foreground ml-2">
              (calculado: {unitWeight}g × {unitsPerBox} un = {((unitWeight * unitsPerBox) / 1000).toFixed(2)}kg)
            </span>
          )}
        </Label>
        <Input
          type="number"
          step="0.1"
          value={data.boxWeightKg}
          onChange={(e) => onChange({ boxWeightKg: e.target.value })}
          placeholder="Ex: 5.5"
        />
        <p className="text-xs text-muted-foreground mt-1">Preenchido automaticamente se o peso unitário foi informado. Você pode editar.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Largura (cm)</Label>
          <Input type="number" value={data.boxWidthCm} onChange={(e) => onChange({ boxWidthCm: e.target.value })} placeholder="0" />
        </div>
        <div>
          <Label>Altura (cm)</Label>
          <Input type="number" value={data.boxHeightCm} onChange={(e) => onChange({ boxHeightCm: e.target.value })} placeholder="0" />
        </div>
        <div>
          <Label>Profundidade (cm)</Label>
          <Input type="number" value={data.boxDepthCm} onChange={(e) => onChange({ boxDepthCm: e.target.value })} placeholder="0" />
        </div>
      </div>

      <div className="border-t pt-4">
        <Label className="font-semibold text-base">📋 Especificação desta caixa *</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Descreva o que torna esta caixa única. O cliente verá este campo em destaque na página do produto.
        </p>
        <Textarea
          value={data.boxSpecification}
          onChange={(e) => onChange({ boxSpecification: e.target.value })}
          placeholder="Ex: Cor: Preto / Tamanho: G / Memória: 512GB"
          rows={3}
        />
        {data.boxSpecification && (
          <div className="mt-3 bg-primary/5 border border-primary/20 rounded-lg p-3">
            <p className="text-xs font-semibold text-primary mb-1">👁️ Preview — como o cliente verá:</p>
            <p className="text-sm font-medium">{data.boxSpecification}</p>
          </div>
        )}
      </div>
    </div>
  );
}
