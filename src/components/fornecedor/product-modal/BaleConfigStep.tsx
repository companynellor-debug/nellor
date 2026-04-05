import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ProductFormData } from './types';

const SIZES = ['PP', 'P', 'M', 'G', 'GG', 'GGG'];

interface Props {
  data: ProductFormData;
  onChange: (updates: Partial<ProductFormData>) => void;
}

export default function BaleConfigStep({ data, onChange }: Props) {
  const toggleSize = (size: string) => {
    const current = data.baleSizesIncluded;
    if (current.includes(size)) {
      onChange({ baleSizesIncluded: current.filter(s => s !== size) });
    } else {
      onChange({ baleSizesIncluded: [...current, size] });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">🧺 Configuração do Fardo</h3>
      <div>
        <Label>Peso do fardo (kg) *</Label>
        <Input type="number" step="0.1" min="1" value={data.baleWeightKg} onChange={(e) => onChange({ baleWeightKg: e.target.value })} placeholder="Ex: 10" />
        {data.baleWeightKg && parseFloat(data.baleWeightKg) < 1 && (
          <p className="text-xs text-destructive mt-1">⚠️ O peso do fardo deve ser no mínimo 1kg</p>
        )}
      </div>
      <div>
        <Label>Quantidade aproximada de peças no fardo</Label>
        <Input type="number" min="1" value={data.baleApproxPieces} onChange={(e) => onChange({ baleApproxPieces: e.target.value })} placeholder="Ex: 50" />
      </div>
      <div className="border-t pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Switch checked={data.baleSameType} onCheckedChange={(v) => onChange({ baleSameType: v })} />
          <Label className="text-sm">As peças são do mesmo tipo?</Label>
        </div>
        {!data.baleSameType && (
          <div>
            <Label>Descreva o mix de produtos *</Label>
            <Textarea value={data.baleMixDescription} onChange={(e) => onChange({ baleMixDescription: e.target.value })}
              placeholder="Ex: camisetas, calças jeans, shorts variados" rows={3} />
          </div>
        )}
      </div>
      <div>
        <Label className="mb-2 block">Tamanhos incluídos no fardo</Label>
        <div className="flex flex-wrap gap-3">
          {SIZES.map((size) => (
            <label key={size} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={data.baleSizesIncluded.includes(size)}
                onCheckedChange={() => toggleSize(size)}
              />
              <span className="text-sm">{size}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <Label>Observações sobre o mix</Label>
        <Textarea value={data.baleObservations} onChange={(e) => onChange({ baleObservations: e.target.value })}
          placeholder="Descreva melhor o conteúdo do fardo" rows={3} />
      </div>
    </div>
  );
}
