import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ProductFormData, BaleType } from './types';
import { Package, Shuffle } from 'lucide-react';

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

  const selectBaleType = (type: BaleType) => {
    onChange({
      baleType: type,
      baleSameType: type === 'single_product',
    });
  };

  return (
    <div className="space-y-5">
      <h3 className="font-semibold text-lg">🧺 Tipo de Fardo</h3>

      {/* Type selection cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => selectBaleType('single_product')}
          className={`text-left p-5 rounded-xl border-2 transition-all ${
            data.baleType === 'single_product'
              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              data.baleType === 'single_product' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              <Package className="h-5 w-5" />
            </div>
            <h4 className="font-semibold">Produto Único</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Todos os itens do fardo são iguais. Ex: fardo com 50 camisetas brancas tamanho G.
          </p>
        </button>

        <button
          type="button"
          onClick={() => selectBaleType('mixed')}
          className={`text-left p-5 rounded-xl border-2 transition-all ${
            data.baleType === 'mixed'
              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              data.baleType === 'mixed' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              <Shuffle className="h-5 w-5" />
            </div>
            <h4 className="font-semibold">Mix Sortido</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Itens variados dentro do fardo. Ex: fardo de 10kg com roupas sortidas.
          </p>
        </button>
      </div>

      {/* Single product fields */}
      {data.baleType === 'single_product' && (
        <div className="space-y-4 border-t pt-4">
          <h4 className="font-medium text-sm text-muted-foreground">Especificações do produto no fardo</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Marca</Label>
              <Input value={data.brand} onChange={(e) => onChange({ brand: e.target.value })} placeholder="Ex: Nike" />
            </div>
            <div>
              <Label>Modelo</Label>
              <Input value={data.model} onChange={(e) => onChange({ model: e.target.value })} placeholder="Ex: Camiseta Básica" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Cor</Label>
              <Input value={data.boxModelDescription} onChange={(e) => onChange({ boxModelDescription: e.target.value })} placeholder="Ex: Branco" />
            </div>
            <div>
              <Label>Tamanho</Label>
              <Input value={data.baleObservations} onChange={(e) => onChange({ baleObservations: e.target.value })} placeholder="Ex: G" />
            </div>
            <div>
              <Label>Material</Label>
              <Input value={data.material} onChange={(e) => onChange({ material: e.target.value })} placeholder="Ex: Algodão" />
            </div>
          </div>
          <div>
            <Label>Quantidade de peças no fardo *</Label>
            <Input type="number" min="1" value={data.baleApproxPieces} onChange={(e) => onChange({ baleApproxPieces: e.target.value })} placeholder="Ex: 50" />
          </div>
          <div>
            <Label>Peso total do fardo (kg) *</Label>
            <Input type="number" step="0.1" min="1" value={data.baleWeightKg} onChange={(e) => onChange({ baleWeightKg: e.target.value })} placeholder="Ex: 10" />
          </div>
        </div>
      )}

      {/* Mixed bale fields */}
      {data.baleType === 'mixed' && (
        <div className="space-y-4 border-t pt-4">
          <h4 className="font-medium text-sm text-muted-foreground">Detalhes do fardo sortido</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Peso total do fardo (kg) *</Label>
              <Input type="number" step="0.1" min="1" value={data.baleWeightKg} onChange={(e) => onChange({ baleWeightKg: e.target.value })} placeholder="Ex: 10" />
            </div>
            <div>
              <Label>Quantidade aproximada de peças</Label>
              <Input type="number" min="1" value={data.baleApproxPieces} onChange={(e) => onChange({ baleApproxPieces: e.target.value })} placeholder="Ex: 50" />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Tamanhos incluídos no mix</Label>
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
            <Label>Descrição do mix *</Label>
            <Textarea
              value={data.baleMixDescription}
              onChange={(e) => onChange({ baleMixDescription: e.target.value })}
              placeholder="Descreva os tipos de produtos incluídos no fardo. Ex: camisetas, calças jeans, shorts variados"
              rows={3}
            />
          </div>

          <div>
            <Label>Composição aproximada</Label>
            <Input
              value={data.baleComposition}
              onChange={(e) => onChange({ baleComposition: e.target.value })}
              placeholder="Ex: 70% feminino, 30% masculino"
            />
          </div>
        </div>
      )}
    </div>
  );
}
