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
  const unitLabel = SALE_TYPE_CONFIG[data.saleType].label;
  const isBale = data.saleType === 'bale';
  const isKit = data.saleType === 'kit';

  return (
    <div className="space-y-4">
      <div>
        <Label>Nome {isKit ? 'do Kit' : isBale ? 'do Fardo' : `do Produto`} * <span className="text-xs text-muted-foreground">({data.name.length}/20 mín.)</span></Label>
        <Input value={data.name} onChange={(e) => onChange({ name: e.target.value })} placeholder={isKit ? "Ex: Kit Skincare Completo Premium" : "Ex: Camiseta Premium Algodão Pima Masculina"} />
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
        <Label>Descrição detalhada * <span className="text-xs text-muted-foreground">({data.description.length}/100 mín.)</span></Label>
        <Textarea value={data.description} onChange={(e) => onChange({ description: e.target.value })}
          placeholder={isBale ? "Descreva o mix de produtos do fardo" : isKit ? "Descreva o kit completo" : "Descreva seu produto com detalhes (mínimo 100 caracteres)"}
          rows={5} />
      </div>
    </div>
  );
}
