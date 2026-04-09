import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Image, Type, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const BG_COLORS = ['#7c3aed', '#2563eb', '#059669', '#dc2626', '#d97706', '#7c3aed', '#0891b2', '#be185d'];

interface CreateStoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateStory: (data: { type: string; caption?: string; media_url?: string; bg_color?: string }) => Promise<void>;
}

export const CreateStoryModal = ({ open, onOpenChange, onCreateStory }: CreateStoryModalProps) => {
  const [mode, setMode] = useState<'choose' | 'text' | 'image'>('choose');
  const [caption, setCaption] = useState('');
  const [bgColor, setBgColor] = useState(BG_COLORS[0]);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (mode === 'text' && !caption.trim()) {
      toast.error('Digite algo para o status');
      return;
    }
    if (mode === 'image' && !imageUrl.trim()) {
      toast.error('Cole a URL da imagem');
      return;
    }

    setLoading(true);
    try {
      await onCreateStory({
        type: mode,
        caption: caption || undefined,
        media_url: mode === 'image' ? imageUrl : undefined,
        bg_color: mode === 'text' ? bgColor : undefined,
      });
      toast.success('Status publicado!');
      onOpenChange(false);
      setMode('choose');
      setCaption('');
      setImageUrl('');
    } catch {
      toast.error('Erro ao publicar status');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMode('choose');
    setCaption('');
    setImageUrl('');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Status</DialogTitle>
        </DialogHeader>

        {mode === 'choose' && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode('text')}
              className="flex flex-col items-center gap-2 p-6 rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <Type className="h-8 w-8 text-primary" />
              <span className="font-medium">Texto</span>
            </button>
            <button
              onClick={() => setMode('image')}
              className="flex flex-col items-center gap-2 p-6 rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <Image className="h-8 w-8 text-primary" />
              <span className="font-medium">Imagem</span>
            </button>
          </div>
        )}

        {mode === 'text' && (
          <div className="space-y-4">
            {/* Preview */}
            <div
              className="w-full aspect-[9/16] max-h-64 rounded-2xl flex items-center justify-center p-6"
              style={{ backgroundColor: bgColor }}
            >
              <p className="text-white text-lg font-bold text-center">
                {caption || 'Seu texto aqui...'}
              </p>
            </div>

            {/* Color picker */}
            <div className="flex gap-2 justify-center">
              {BG_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setBgColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${bgColor === color ? 'border-foreground scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Digite seu status..."
              maxLength={200}
              className="min-h-20"
            />

            <Button onClick={handleCreate} disabled={loading} className="w-full gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Publicar Status
            </Button>
          </div>
        )}

        {mode === 'image' && (
          <div className="space-y-4">
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Cole a URL da imagem..."
            />
            {imageUrl && (
              <div className="w-full aspect-video rounded-2xl overflow-hidden bg-muted">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Legenda (opcional)"
            />
            <Button onClick={handleCreate} disabled={loading} className="w-full gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Publicar Status
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
