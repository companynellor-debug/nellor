import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { ProductFormData } from './types';
import { toast } from 'sonner';

interface Props {
  data: ProductFormData;
  onChange: (updates: Partial<ProductFormData>) => void;
}

export default function ImagesStep({ data, onChange }: Props) {
  const isBox = data.saleType === 'closed_box';
  const isBale = data.saleType === 'bale';
  const isKit = data.saleType === 'kit';
  const minImages = (isBox || isBale) ? 2 : 3;

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (data.images.length + files.length > 10) { toast.error("Máximo 10 imagens"); return; }
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => onChange({ images: [...data.images, reader.result as string] });
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx: number) => {
    onChange({ images: data.images.filter((_, i) => i !== idx) });
  };

  const getImageLabels = (): string[] => {
    if (isBox) return ['📦 Caixa fechada', '📱 Produto interno'];
    if (isBale && data.baleType === 'mixed') return ['📦 Fardo fechado', '📂 Fardo aberto'];
    if (isBale) return ['📦 Fardo fechado', '👕 Produto'];
    return [];
  };

  const imageLabels = getImageLabels();

  const tip = isBox
    ? '1ª foto: caixa fechada (obrigatória). 2ª foto: produto dentro da caixa (obrigatória). Demais são opcionais.'
    : isBale && data.baleType === 'mixed'
      ? '1ª foto: fardo fechado. 2ª foto: fardo aberto mostrando o conteúdo. Demais fotos das peças.'
      : isBale
        ? '1ª foto: fardo fechado. 2ª foto: produto do fardo. Demais são opcionais.'
        : isKit
          ? 'A primeira foto deve ser do kit completo montado.'
          : 'Fotos com fundo branco vendem até 3x mais!';

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
        <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">💡 {tip}</p>
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">A primeira foto será a capa do produto. Mínimo {minImages}, máximo 10.</p>
      </div>
      <Input type="file" accept="image/*" multiple onChange={handleUpload} disabled={data.images.length >= 10} className="cursor-pointer" />
      <p className="text-sm text-muted-foreground">
        {data.images.length}/10 imagens 
        {data.images.length < minImages && <span className="text-destructive"> (mínimo {minImages})</span>}
      </p>
      {data.images.length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {data.images.map((img, index) => (
            <div key={index} className="relative group">
              <img src={img} alt={`Preview ${index + 1}`} className="w-full aspect-square object-cover rounded-md border" />
              {index === 0 && <Badge className="absolute top-1 left-1 text-[10px] py-0">Capa</Badge>}
              {imageLabels[index] && (
                <Badge variant="secondary" className="absolute bottom-1 left-1 text-[9px] py-0 max-w-full truncate">
                  {imageLabels[index]}
                </Badge>
              )}
              <button type="button" onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
