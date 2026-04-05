import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { VariationsEditor, VariationColor, VariationType } from '@/components/fornecedor/VariationsEditor';
import { ProductFormData } from './types';

interface Props {
  data: ProductFormData;
  onChange: (updates: Partial<ProductFormData>) => void;
  hasColors: boolean;
  setHasColors: (v: boolean) => void;
  hasSizes: boolean;
  setHasSizes: (v: boolean) => void;
  variationType: VariationType;
  setVariationType: (v: VariationType) => void;
  variationColors: VariationColor[];
  setVariationColors: (v: VariationColor[]) => void;
  variationSizes: string[];
  setVariationSizes: (v: string[]) => void;
  variationGrid: Record<string, Record<string, { stock: number; price: number | null }>>;
  setVariationGrid: (v: Record<string, Record<string, { stock: number; price: number | null }>>) => void;
}

export default function VariationsStep({
  data, onChange,
  hasColors, setHasColors, hasSizes, setHasSizes,
  variationType, setVariationType,
  variationColors, setVariationColors,
  variationSizes, setVariationSizes,
  variationGrid, setVariationGrid,
}: Props) {
  const isPair = data.saleType === 'pair';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Switch checked={data.hasVariations} onCheckedChange={(v) => {
          onChange({ hasVariations: v });
          if (!v) { setHasColors(false); setHasSizes(false); setVariationColors([]); setVariationSizes([]); setVariationGrid({}); }
          else { setHasColors(true); setHasSizes(true); if (isPair) setVariationType('numbering'); }
        }} />
        <Label className="text-sm font-semibold">Ativar variações</Label>
      </div>
      {data.hasVariations && (
        <>
          <div className="flex gap-6 mb-3">
            <div className="flex items-center gap-2">
              <Switch checked={hasColors} onCheckedChange={(v) => {
                setHasColors(v);
                if (!v) { setVariationColors([]); setVariationGrid({}); }
              }} />
              <Label className="text-sm">🎨 Cores (foto obrigatória)</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={hasSizes} onCheckedChange={(v) => {
                setHasSizes(v);
                if (!v) { setVariationSizes([]); setVariationGrid({}); }
              }} />
              <Label className="text-sm">📏 Variação secundária</Label>
            </div>
          </div>
          <VariationsEditor
            colors={variationColors} setColors={setVariationColors}
            sizes={variationSizes} setSizes={setVariationSizes}
            variationGrid={variationGrid} setVariationGrid={setVariationGrid}
            hasColors={hasColors} hasSizes={hasSizes}
            variationType={variationType} setVariationType={setVariationType}
          />
        </>
      )}
      {!data.hasVariations && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Ative as variações para adicionar cores, tamanhos e outras opções ao seu produto.
        </p>
      )}
    </div>
  );
}
