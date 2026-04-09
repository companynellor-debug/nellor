import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Image, Type, Loader2, Video, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

const BG_COLORS = [
  '#7c3aed', '#2563eb', '#059669', '#dc2626', '#d97706',
  '#0891b2', '#be185d', '#4f46e5', '#0d9488', '#ea580c',
  '#7c2d12', '#1e3a5f', '#166534', '#831843', '#78350f',
  '#0f172a', '#334155', '#6d28d9', '#db2777', '#f59e0b',
];

interface CreateStoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateStory: (data: { type: string; caption?: string; media_url?: string; bg_color?: string }) => Promise<void>;
}

export const CreateStoryModal = ({ open, onOpenChange, onCreateStory }: CreateStoryModalProps) => {
  const { user } = useSupabaseAuth();
  const [mode, setMode] = useState<'choose' | 'text' | 'media'>('choose');
  const [caption, setCaption] = useState('');
  const [bgColor, setBgColor] = useState(BG_COLORS[0]);
  const [customColor, setCustomColor] = useState('#7c3aed');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video'>('image');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > 50 * 1024 * 1024) {
      toast.error('Arquivo muito grande (máx 50MB)');
      return;
    }
    setFile(selected);
    setFileType(selected.type.startsWith('video/') ? 'video' : 'image');
    const url = URL.createObjectURL(selected);
    setFilePreview(url);
  };

  const uploadFile = async (file: File): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('supplier-stories').upload(path, file, { contentType: file.type });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('supplier-stories').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleCreate = async () => {
    if (mode === 'text' && !caption.trim()) {
      toast.error('Digite algo para o status');
      return;
    }
    if (mode === 'media' && !file) {
      toast.error('Selecione uma foto ou vídeo');
      return;
    }

    setLoading(true);
    try {
      let mediaUrl: string | undefined;
      if (mode === 'media' && file) {
        mediaUrl = await uploadFile(file);
      }
      await onCreateStory({
        type: mode === 'media' ? fileType : 'text',
        caption: caption || undefined,
        media_url: mediaUrl,
        bg_color: mode === 'text' ? bgColor : undefined,
      });
      toast.success('Status publicado!');
      onOpenChange(false);
      reset();
    } catch {
      toast.error('Erro ao publicar status');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMode('choose');
    setCaption('');
    setFile(null);
    setFilePreview(null);
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
              onClick={() => setMode('media')}
              className="flex flex-col items-center gap-2 p-6 rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <Upload className="h-8 w-8 text-primary" />
              <span className="font-medium">Foto / Vídeo</span>
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

            {/* Color grid + custom picker */}
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 justify-center">
                {BG_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setBgColor(color)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${bgColor === color ? 'border-foreground scale-110 ring-2 ring-primary/30' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                {/* Custom color picker */}
                <div className="relative">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => { setCustomColor(e.target.value); setBgColor(e.target.value); }}
                    className="absolute inset-0 w-7 h-7 opacity-0 cursor-pointer"
                  />
                  <div
                    className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${!BG_COLORS.includes(bgColor) ? 'border-foreground scale-110 ring-2 ring-primary/30' : 'border-muted-foreground/30'}`}
                    style={{ background: `conic-gradient(red, yellow, lime, aqua, blue, magenta, red)` }}
                  />
                </div>
              </div>
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

        {mode === 'media' && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {!filePreview ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center gap-3 transition-all"
              >
                <Upload className="h-10 w-10 text-primary/60" />
                <span className="text-sm text-muted-foreground">Toque para selecionar foto ou vídeo</span>
              </button>
            ) : (
              <div className="w-full aspect-video rounded-2xl overflow-hidden bg-muted relative">
                {fileType === 'video' ? (
                  <video src={filePreview} controls className="w-full h-full object-cover" />
                ) : (
                  <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                )}
                <button
                  onClick={() => { setFile(null); setFilePreview(null); }}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80"
                >
                  ✕
                </button>
              </div>
            )}

            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Legenda (opcional)"
            />
            <Button onClick={handleCreate} disabled={loading || !file} className="w-full gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Publicar Status
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
