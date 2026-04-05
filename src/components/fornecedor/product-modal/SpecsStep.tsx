import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { ProductFormData, SALE_TYPE_CONFIG } from './types';
import { useState } from 'react';

interface Props {
  data: ProductFormData;
  onChange: (updates: Partial<ProductFormData>) => void;
}

export default function SpecsStep({ data, onChange }: Props) {
  const [keywordInput, setKeywordInput] = useState('');
  const unitLabel = SALE_TYPE_CONFIG[data.saleType].unitLabel;
  const isPair = data.saleType === 'pair';
  const isBox = data.saleType === 'closed_box';

  const addKeyword = (value: string) => {
    const word = value.trim().toLowerCase();
    if (word && !data.keywords.includes(word) && data.keywords.length < 10) {
      onChange({ keywords: [...data.keywords, word] });
    }
    setKeywordInput('');
  };

  return (
    <div className="space-y-4">
      {isBox && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
          <p className="text-sm text-primary font-medium">
            📋 Estas especificações descrevem o <strong>produto dentro da caixa</strong>, não a caixa em si.
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Peso {isPair ? 'do par' : 'unitário'} (gramas) *</Label>
          <Input type="number" value={data.weightGrams} onChange={(e) => onChange({ weightGrams: e.target.value })} placeholder="Ex: 350" />
        </div>
        <div>
          <Label>Garantia (dias)</Label>
          <Input type="number" value={data.warrantyDays} onChange={(e) => onChange({ warrantyDays: e.target.value })} placeholder="Ex: 90" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Largura (cm) *</Label>
          <Input type="number" value={data.widthCm} onChange={(e) => onChange({ widthCm: e.target.value })} placeholder="0" />
        </div>
        <div>
          <Label>Altura (cm) *</Label>
          <Input type="number" value={data.heightCm} onChange={(e) => onChange({ heightCm: e.target.value })} placeholder="0" />
        </div>
        <div>
          <Label>Profundidade (cm) *</Label>
          <Input type="number" value={data.depthCm} onChange={(e) => onChange({ depthCm: e.target.value })} placeholder="0" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Material/Composição</Label>
          <Input value={data.material} onChange={(e) => onChange({ material: e.target.value })} placeholder="Ex: 100% Algodão" />
        </div>
        <div>
          <Label>Gênero</Label>
          <Select value={data.gender} onValueChange={(v) => onChange({ gender: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Não se aplica</SelectItem>
              <SelectItem value="male">Masculino</SelectItem>
              <SelectItem value="female">Feminino</SelectItem>
              <SelectItem value="unisex">Unissex</SelectItem>
              <SelectItem value="kids">Infantil</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Faixa Etária</Label>
          <Select value={data.ageGroup} onValueChange={(v) => onChange({ ageGroup: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Não se aplica</SelectItem>
              <SelectItem value="adult">Adulto</SelectItem>
              <SelectItem value="teen">Adolescente</SelectItem>
              <SelectItem value="child">Criança</SelectItem>
              <SelectItem value="baby">Bebê</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>NCM <span className="text-xs text-muted-foreground">(opcional)</span></Label>
          <Input value={data.ncmCode} onChange={(e) => {
            let v = e.target.value.replace(/\D/g, '').slice(0, 8);
            if (v.length > 4) v = v.slice(0, 4) + '.' + v.slice(4);
            if (v.length > 7) v = v.slice(0, 7) + '.' + v.slice(7);
            onChange({ ncmCode: v });
          }} placeholder="0000.00.00" />
        </div>
      </div>
      <div>
        <Label>Palavras-chave <span className="text-xs text-muted-foreground">({data.keywords.length}/10)</span></Label>
        <Input
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value.replace(',', ''))}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addKeyword(keywordInput); } }}
          onBlur={() => keywordInput && addKeyword(keywordInput)}
          placeholder="Digite e pressione Enter"
          disabled={data.keywords.length >= 10}
        />
        {data.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {data.keywords.map((word) => (
              <Badge key={word} variant="secondary" className="gap-1 pr-1">
                {word}
                <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => onChange({ keywords: data.keywords.filter(k => k !== word) })} />
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
