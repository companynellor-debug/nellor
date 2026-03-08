import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Upload } from 'lucide-react';
import { getColorHex } from '@/utils/colorMap';

export interface VariationColor {
  name: string;
  hex: string;
  imageUrl: string;
}

export interface VariationRow {
  color: string;
  colorHex: string;
  size: string;
  stock: number;
  price: number | null;
  imageUrl: string;
  variationType: string;
  variationLabel: string;
  variationValue: string;
}

export type VariationType = 'size' | 'numbering' | 'memory' | 'volume' | 'custom';

interface VariationsEditorProps {
  colors: VariationColor[];
  setColors: (colors: VariationColor[]) => void;
  sizes: string[];
  setSizes: (sizes: string[]) => void;
  variationGrid: Record<string, Record<string, { stock: number; price: number | null }>>;
  setVariationGrid: (grid: Record<string, Record<string, { stock: number; price: number | null }>>) => void;
  hasColors: boolean;
  hasSizes: boolean;
  variationType: VariationType;
  setVariationType: (t: VariationType) => void;
}

const VARIATION_TYPE_CONFIG: Record<VariationType, { label: string; presets: string[]; placeholder: string }> = {
  size: { label: 'Tamanho', presets: ['PP', 'P', 'M', 'G', 'GG', 'XG', 'GGG'], placeholder: 'Ex: XGG' },
  numbering: { label: 'Numeração', presets: ['34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'], placeholder: 'Ex: 46' },
  memory: { label: 'Memória', presets: ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB'], placeholder: 'Ex: 2TB' },
  volume: { label: 'Volume', presets: ['100ml', '200ml', '500ml', '1L', '2L', '5L'], placeholder: 'Ex: 10L' },
  custom: { label: 'Personalizado', presets: [], placeholder: 'Digite o valor' },
};

export const VariationsEditor = ({
  colors, setColors, sizes, setSizes,
  variationGrid, setVariationGrid,
  hasColors, hasSizes, variationType, setVariationType,
}: VariationsEditorProps) => {
  const [colorName, setColorName] = useState('');
  const [colorHex, setColorHex] = useState('#000000');
  const [sizeInput, setSizeInput] = useState('');

  const config = VARIATION_TYPE_CONFIG[variationType];

  const addColor = () => {
    const name = colorName.trim();
    if (!name || colors.some(c => c.name === name)) return;
    const hex = colorHex || getColorHex(name) || '#000000';
    setColors([...colors, { name, hex, imageUrl: '' }]);
    const newGrid = { ...variationGrid };
    newGrid[name] = {};
    if (hasSizes) {
      sizes.forEach(s => { newGrid[name][s] = { stock: 0, price: null }; });
    } else {
      newGrid[name]['_default'] = { stock: 0, price: null };
    }
    setVariationGrid(newGrid);
    setColorName('');
    setColorHex('#000000');
  };

  const removeColor = (name: string) => {
    setColors(colors.filter(c => c.name !== name));
    const newGrid = { ...variationGrid };
    delete newGrid[name];
    setVariationGrid(newGrid);
  };

  const handleColorImageUpload = (colorName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setColors(colors.map(c => c.name === colorName ? { ...c, imageUrl: reader.result as string } : c));
    };
    reader.readAsDataURL(file);
  };

  const addSize = (size: string) => {
    const s = size.trim();
    if (!s || sizes.includes(s)) return;
    const newSizes = [...sizes, s];
    setSizes(newSizes);
    const newGrid = { ...variationGrid };
    Object.keys(newGrid).forEach(color => {
      if (!newGrid[color][s]) newGrid[color][s] = { stock: 0, price: null };
    });
    if (!hasColors && !newGrid['_default']) newGrid['_default'] = {};
    if (!hasColors) newGrid['_default'][s] = { stock: 0, price: null };
    setVariationGrid(newGrid);
    setSizeInput('');
  };

  const removeSize = (size: string) => {
    setSizes(sizes.filter(s => s !== size));
    const newGrid = { ...variationGrid };
    Object.keys(newGrid).forEach(color => { delete newGrid[color][size]; });
    setVariationGrid(newGrid);
  };

  const updateCell = (colorKey: string, sizeKey: string, field: 'stock' | 'price', value: number | null) => {
    const newGrid = { ...variationGrid };
    if (!newGrid[colorKey]) newGrid[colorKey] = {};
    if (!newGrid[colorKey][sizeKey]) newGrid[colorKey][sizeKey] = { stock: 0, price: null };
    newGrid[colorKey][sizeKey] = { ...newGrid[colorKey][sizeKey], [field]: value };
    setVariationGrid(newGrid);
  };

  const colorKeys = hasColors ? colors.map(c => c.name) : ['_default'];
  const sizeKeys = hasSizes ? sizes : ['_default'];

  return (
    <div className="space-y-4">
      {/* Color management */}
      {hasColors && (
        <div className="space-y-3">
          <Label className="font-semibold">Cores com foto</Label>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label className="text-xs">Nome da cor</Label>
              <Input value={colorName} onChange={e => setColorName(e.target.value)} placeholder="Ex: Preto"
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addColor())} />
            </div>
            <div className="w-20">
              <Label className="text-xs">Cor</Label>
              <Input type="color" value={colorHex} onChange={e => setColorHex(e.target.value)} className="h-10 p-1 cursor-pointer" />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addColor} className="h-10">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {colors.length > 0 && (
            <div className="space-y-2">
              {colors.map(color => (
                <div key={color.name} className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                  <div className="w-8 h-8 rounded-full border border-border flex-shrink-0" style={{ backgroundColor: color.hex }} />
                  <span className="text-sm font-medium flex-1">{color.name}</span>
                  {color.imageUrl ? (
                    <img src={color.imageUrl} alt={color.name} className="w-10 h-10 rounded object-cover" />
                  ) : (
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-1 text-xs text-primary hover:underline">
                        <Upload className="h-3 w-3" /> Foto *
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleColorImageUpload(color.name, e)} />
                    </label>
                  )}
                  <X className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-destructive" onClick={() => removeColor(color.name)} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Variation type selector + values */}
      {hasSizes && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label className="font-semibold">Tipo de variação</Label>
              <Select value={variationType} onValueChange={(v) => setVariationType(v as VariationType)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="size">Tamanho (P/M/G)</SelectItem>
                  <SelectItem value="numbering">Numeração (34-45)</SelectItem>
                  <SelectItem value="memory">Memória (GB/TB)</SelectItem>
                  <SelectItem value="volume">Volume (ml/L)</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Label className="font-semibold">{config.label}</Label>
          {config.presets.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {config.presets.map(s => (
                <Badge key={s} variant={sizes.includes(s) ? "default" : "outline"} className="cursor-pointer select-none text-xs"
                  onClick={() => sizes.includes(s) ? removeSize(s) : addSize(s)}>{s}</Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input value={sizeInput} onChange={e => setSizeInput(e.target.value)} placeholder={config.placeholder}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSize(sizeInput))} className="flex-1" />
            <Button type="button" variant="outline" size="sm" onClick={() => addSize(sizeInput)}>+</Button>
          </div>
          {sizes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {sizes.map(s => (
                <Badge key={s} variant="secondary" className="gap-1 text-xs">
                  {s}<X className="h-3 w-3 cursor-pointer" onClick={() => removeSize(s)} />
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Variation Grid */}
      {(hasColors || hasSizes) && colorKeys.length > 0 && sizeKeys.length > 0 && (
        <div className="space-y-2">
          <Label className="font-semibold">Grade de Estoque {hasSizes && hasColors ? `(${config.label} × Cor)` : ''}</Label>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  {hasColors && <th className="text-left p-2 text-xs font-medium">Cor</th>}
                  {sizeKeys.map(s => (
                    <th key={s} className="text-center p-1 text-xs font-medium" colSpan={1}>
                      {s === '_default' ? 'Estoque' : s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {colorKeys.map(ck => (
                  <tr key={ck} className="border-t border-border">
                    {hasColors && (
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: colors.find(c => c.name === ck)?.hex || '#ccc' }} />
                          <span className="text-xs">{ck}</span>
                        </div>
                      </td>
                    )}
                    {sizeKeys.map(sk => (
                      <td key={sk} className="p-1 text-center">
                        <Input type="number" min="0" className="w-16 h-8 text-center text-xs mx-auto"
                          value={variationGrid[ck]?.[sk]?.stock ?? 0}
                          onChange={e => updateCell(ck, sk, 'stock', parseInt(e.target.value) || 0)} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper: convert editor state to flat VariationRow[]
export const editorToVariationRows = (
  colors: VariationColor[],
  sizes: string[],
  grid: Record<string, Record<string, { stock: number; price: number | null }>>,
  hasColors: boolean,
  hasSizes: boolean,
  variationType: VariationType = 'size',
): VariationRow[] => {
  const rows: VariationRow[] = [];
  const colorKeys = hasColors ? colors.map(c => c.name) : ['_default'];
  const sizeKeys = hasSizes ? sizes : ['_default'];
  const config = VARIATION_TYPE_CONFIG[variationType];

  colorKeys.forEach(ck => {
    const colorData = hasColors ? colors.find(c => c.name === ck) : null;
    sizeKeys.forEach(sk => {
      const cell = grid[ck]?.[sk] || { stock: 0, price: null };
      rows.push({
        color: hasColors ? ck : '',
        colorHex: colorData?.hex || '',
        size: hasSizes ? sk : '',
        stock: cell.stock,
        price: cell.price,
        imageUrl: colorData?.imageUrl || '',
        variationType,
        variationLabel: config.label,
        variationValue: hasSizes ? sk : '',
      });
    });
  });
  return rows.filter(r => r.stock > 0 || hasColors || hasSizes);
};

// Helper: convert DB variations back to editor state
export const variationsToEditorState = (variations: Array<{
  color: string | null; color_hex: string | null; size: string | null;
  stock: number; price: number | null; image_url: string | null;
  variation_type?: string | null; variation_label?: string | null; variation_value?: string | null;
}>) => {
  const colorMap = new Map<string, VariationColor>();
  const sizeSet = new Set<string>();
  const grid: Record<string, Record<string, { stock: number; price: number | null }>> = {};
  let detectedType: VariationType = 'size';

  variations.forEach(v => {
    const ck = v.color || '_default';
    const sk = v.variation_value || v.size || '_default';

    if (v.color && !colorMap.has(v.color)) {
      colorMap.set(v.color, { name: v.color, hex: v.color_hex || '#000000', imageUrl: v.image_url || '' });
    }
    if (sk !== '_default') sizeSet.add(sk);
    if (v.variation_type) detectedType = v.variation_type as VariationType;

    if (!grid[ck]) grid[ck] = {};
    grid[ck][sk] = { stock: v.stock, price: v.price };
  });

  return {
    colors: Array.from(colorMap.values()),
    sizes: Array.from(sizeSet),
    grid,
    hasColors: colorMap.size > 0,
    hasSizes: sizeSet.size > 0,
    variationType: detectedType,
  };
};
