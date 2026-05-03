import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, X, Image as ImageIcon } from 'lucide-react';
import { ProductFormData, KitItem } from './types';

interface Props {
  data: ProductFormData;
  onChange: (updates: Partial<ProductFormData>) => void;
}

export default function KitCompositionStep({ data, onChange }: Props) {
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState('1');

  const addItem = () => {
    const name = itemName.trim();
    const qty = parseInt(itemQty) || 1;
    if (!name) return;
    onChange({ kitItems: [...data.kitItems, { name, quantity: qty }] });
    setItemName('');
    setItemQty('1');
  };

  const removeItem = (idx: number) => {
    onChange({ kitItems: data.kitItems.filter((_, i) => i !== idx) });
  };

  const totalPieces = data.kitItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">🎁 Composição do Kit</h3>

      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
        <Label className="font-medium">Adicionar Item ao Kit</Label>
        <div className="flex gap-2">
          <Input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Nome do item"
            className="flex-1" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())} />
          <Input type="number" value={itemQty} onChange={(e) => setItemQty(e.target.value)}
            placeholder="Qtd" className="w-20" min="1" />
          <Button type="button" variant="outline" size="icon" onClick={addItem}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {data.kitItems.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="font-medium">Itens do Kit</Label>
            <span className="text-xs text-muted-foreground">Total: {totalPieces} peça(s)</span>
          </div>
          {data.kitItems.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{item.quantity}x</span>
                <span className="text-sm">{item.name}</span>
              </div>
              <button onClick={() => removeItem(idx)} className="text-muted-foreground hover:text-destructive">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {data.kitItems.length < 2 && (
        <p className="text-xs text-destructive">⚠️ O kit precisa ter pelo menos 2 itens</p>
      )}

      <div>
        <Label>O que está incluso — descrição completa</Label>
        <Textarea value={data.kitWhatsIncluded} onChange={(e) => onChange({ kitWhatsIncluded: e.target.value })}
          placeholder="Ex: 1x Sérum facial 30ml, 1x Hidratante 50ml, 1x Protetor solar 40ml" rows={3} />
      </div>
    </div>
  );
}
