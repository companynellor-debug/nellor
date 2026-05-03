import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductFormData, SALE_TYPE_CONFIG } from './types';

interface Props {
  data: ProductFormData;
  onChange: (updates: Partial<ProductFormData>) => void;
  categories: { id: string; nome: string }[];
  customCategories: { id: string; nome: string }[];
}

export default function BasicInfoStep({ data, onChange, categories, customCategories }: Props) {
  const isBale = data.saleType === 'bale';
  const isKit = data.saleType === 'kit';
  const isBox = data.saleType === 'closed_box';

  const nameLabel = isKit ? 'do Kit' : isBale ? 'do Fardo' : isBox ? 'da Caixa' : 'do Produto';
  const namePlaceholder = isBox
    ? 'Ex: Caixa com 12 unidades — Camiseta Básica Branca'
    : isKit
      ? 'Ex: Kit Skincare Completo Premium'
      : isBale
        ? 'Ex: Fardo 10kg Roupas Femininas Sortidas'
        : 'Ex: Camiseta Premium Algodão Pima Masculina';

  return (
    <div className="space-y-4">
      {isBox && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
          <p className="text-sm text-primary font-medium">
            📦 Na Nellor, todos os produtos dentro da caixa devem ser idênticos. Cada variação de cor, tamanho ou configuração deve ser cadastrada como uma caixa separada.
          </p>
        </div>
      )}

      <div>
        <Label>Nome {nameLabel} * <span className="text-xs text-muted-foreground">({data.name.length}/20 mín.)</span></Label>
        <Input value={data.name} onChange={(e) => onChange({ name: e.target.value })} placeholder={namePlaceholder} />
        {isBox && (
          <p className="text-xs text-muted-foreground mt-1">Descreva o produto e a quantidade. Ex: "Caixa com 12 unidades — Poco X5 Pro Preto 512GB"</p>
        )}
      </div>
      <div>
        <Label>Categoria *</Label>
        <Select value={data.category} onValueChange={(v) => onChange({ category: v })}>
          <SelectTrigger className="bg-background"><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent className="bg-popover border shadow-lg z-50">
            <SelectGroup>
              <SelectLabel>Categorias do Sistema</SelectLabel>
              {categories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>)}
            </SelectGroup>
            {customCategories.length > 0 && (
              <SelectGroup>
                <SelectLabel>Minhas Categorias</SelectLabel>
                {customCategories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>)}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>
      </div>
      {!isBale && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Marca {!isKit ? '*' : ''}</Label>
            <Input value={data.brand} onChange={(e) => onChange({ brand: e.target.value })} placeholder="Ex: Nike" />
          </div>
          <div>
            <Label>Modelo</Label>
            <Input value={data.model} onChange={(e) => onChange({ model: e.target.value })} placeholder="Ex: Air Max 90" />
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Condição *</Label>
          <Select value={data.condition} onValueChange={(v) => onChange({ condition: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Novo</SelectItem>
              <SelectItem value="used">Usado</SelectItem>
              <SelectItem value="refurbished">Recondicionado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Origem</Label>
          <Select value={data.isInternational ? 'international' : 'national'} onValueChange={(v) => onChange({ isInternational: v === 'international' })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="national">Nacional</SelectItem>
              <SelectItem value="international">Internacional</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>
          {isBox ? 'Descrição detalhada do produto dentro da caixa' : 'Descrição detalhada'} * 
          <span className="text-xs text-muted-foreground ml-1">({data.description.length}/100 mín.)</span>
        </Label>
        <Textarea value={data.description} onChange={(e) => onChange({ description: e.target.value })}
          placeholder={isBale ? "Descreva o mix de produtos do fardo" : isKit ? "Descreva o kit completo" : isBox ? "Descreva detalhadamente o produto que está dentro da caixa" : "Descreva seu produto com detalhes (mínimo 100 caracteres)"}
          rows={5} />
      </div>
    </div>
  );
}
