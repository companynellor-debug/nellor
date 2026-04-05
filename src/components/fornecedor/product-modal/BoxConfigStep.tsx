import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ProductFormData } from './types';

interface Props {
  data: ProductFormData;
  onChange: (updates: Partial<ProductFormData>) => void;
}

export default function BoxConfigStep({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">📦 Configuração da Caixa</h3>
      <div>
        <Label>Quantidade de unidades por caixa *</Label>
        <Input type="number" min="1" value={data.unitsPerBox} onChange={(e) => onChange({ unitsPerBox: e.target.value })} placeholder="Ex: 12" />
        {data.unitsPerBox && parseInt(data.unitsPerBox) === 0 && (
          <p className="text-xs text-destructive mt-1">A quantidade por caixa não pode ser 0</p>
        )}
      </div>
      <div>
        <Label>Peso total da caixa (kg)</Label>
        <Input type="number" step="0.1" value={data.boxWeightKg} onChange={(e) => onChange({ boxWeightKg: e.target.value })} placeholder="Ex: 5.5" />
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
        <div className="flex items-center gap-2 mb-3">
          <Switch checked={data.boxAllSame} onCheckedChange={(v) => onChange({ boxAllSame: v })} />
          <Label className="text-sm">Os produtos dentro da caixa são todos iguais?</Label>
        </div>
        {data.boxAllSame ? (
          <div>
            <Label>Modelo único dos produtos</Label>
            <Input value={data.model} onChange={(e) => onChange({ model: e.target.value })} placeholder="Ex: Camiseta Básica Branca M" />
          </div>
        ) : (
          <div>
            <Label>Descreva o mix de produtos da caixa *</Label>
            <Textarea value={data.boxModelDescription} onChange={(e) => onChange({ boxModelDescription: e.target.value })}
              placeholder="Ex: 4 camisetas brancas P, 4 pretas M, 4 cinza G" rows={3} />
          </div>
        )}
      </div>
    </div>
  );
}
