import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { ProductFormData, SALE_TYPE_CONFIG } from './types';
import { toast } from 'sonner';

interface Props {
  data: ProductFormData;
  onChange: (updates: Partial<ProductFormData>) => void;
}

export default function ImagesStep({ data, onChange }: Props) {
  const isBox = data.saleType === 'closed_box';
  const isBale = data.saleType === 'bale';
  const isKit = data.saleType === 'kit';

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

  const tip = isBox
    ? 'A primeira foto deve ser da caixa fechada.'
    : isBale
      ? 'Foto do fardo fechado, fardo aberto mostrando o mix e fotos das peças.'
      : isKit
        ? 'A primeira foto deve ser do kit completo montado.'
        : 'Fotos com fundo branco vendem até 3x mais!';

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-sm text-amber-800 font-medium">💡 {tip}</p>
        <p className="text-xs text-amber-600 mt-1">A primeira foto será a capa do produto. Mínimo 3, máximo 10.</p>
      </div>
      <Input type="file" accept="image/*" multiple onChange={handleUpload} disabled={data.images.length >= 10} className="cursor-pointer" />
      <p className="text-sm text-muted-foreground">{data.images.length}/10 imagens {data.images.length < 3 && <span className="text-destructive">(mínimo 3)</span>}</p>
      {data.images.length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {data.images.map((img, index) => (
            <div key={index} className="relative group">
              <img src={img} alt={`Preview ${index + 1}`} className="w-full aspect-square object-cover rounded-md border" />
              {index === 0 && <Badge className="absolute top-1 left-1 text-[10px] py-0">Capa</Badge>}
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
