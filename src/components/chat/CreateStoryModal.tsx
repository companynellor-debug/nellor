import { useState, useRef, useEffect } from 'react';
import { X, Type, Image as ImageIcon, Loader2, Send } from 'lucide-react';
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
  const [tab, setTab] = useState<'text' | 'media'>('text');
  const [caption, setCaption] = useState('');
  const [bgColor, setBgColor] = useState(BG_COLORS[0]);
  const [customColor, setCustomColor] = useState('#7c3aed');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video'>('image');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && tab === 'text') {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open, tab]);

  if (!open) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > 50 * 1024 * 1024) {
      toast.error('Arquivo muito grande (máx 50MB)');
      return;
    }
    setFile(selected);
    setFileType(selected.type.startsWith('video/') ? 'video' : 'image');
    setFilePreview(URL.createObjectURL(selected));
  };

  const uploadFile = async (f: File): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    const ext = f.name.split('.').pop() || 'jpg';
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('supplier-stories').upload(path, f, { contentType: f.type });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('supplier-stories').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleCreate = async () => {
    if (tab === 'text' && !caption.trim()) {
      toast.error('Digite algo para o status');
      return;
    }
    if (tab === 'media' && !file) {
      toast.error('Selecione uma foto ou vídeo');
      return;
    }
    setLoading(true);
    try {
      let mediaUrl: string | undefined;
      if (tab === 'media' && file) {
        mediaUrl = await uploadFile(file);
      }
      await onCreateStory({
        type: tab === 'media' ? fileType : 'text',
        caption: caption || undefined,
        media_url: mediaUrl,
        bg_color: tab === 'text' ? bgColor : undefined,
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
    setTab('text');
    setCaption('');
    setFile(null);
    setFilePreview(null);
    setBgColor(BG_COLORS[0]);
  };

  const switchToMedia = () => {
    setTab('media');
    setTimeout(() => fileInputRef.current?.click(), 150);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 z-10">
        <button onClick={() => { reset(); onOpenChange(false); }} className="p-1.5 text-white hover:bg-white/10 rounded-full">
          <X className="h-6 w-6" />
        </button>
        <span className="text-white font-semibold text-base">Criar Status</span>
        <button
          onClick={handleCreate}
          disabled={loading || (tab === 'text' && !caption.trim()) || (tab === 'media' && !file)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-primary to-purple-500 text-white font-semibold text-sm disabled:opacity-40 transition-opacity"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Publicar
        </button>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        {tab === 'text' ? (
          <div
            className="w-full h-full flex items-center justify-center p-8 transition-colors duration-300"
            style={{ backgroundColor: bgColor }}
          >
            <textarea
              ref={textareaRef}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Digite seu status..."
              maxLength={200}
              className="bg-transparent text-white text-2xl font-bold text-center w-full max-w-md resize-none border-none outline-none placeholder:text-white/40 leading-relaxed"
              rows={5}
              style={{ caretColor: 'white' }}
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900">
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
                className="flex flex-col items-center gap-4 text-white/60 hover:text-white/80 transition-colors"
              >
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center">
                  <ImageIcon className="h-8 w-8" />
                </div>
                <span className="text-sm font-medium">Toque para selecionar</span>
              </button>
            ) : (
              <div className="w-full h-full relative flex items-center justify-center">
                {fileType === 'video' ? (
                  <video src={filePreview} controls className="max-w-full max-h-full object-contain" />
                ) : (
                  <img src={filePreview} alt="" className="max-w-full max-h-full object-contain" />
                )}
                <button
                  onClick={() => { setFile(null); setFilePreview(null); }}
                  className="absolute top-4 right-4 bg-black/60 text-white rounded-full p-2 hover:bg-black/80"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Caption for media mode */}
      {tab === 'media' && filePreview && (
        <div className="px-4 py-3 bg-black/80">
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Adicionar legenda..."
            maxLength={200}
            className="w-full bg-white/10 text-white rounded-full px-4 py-2.5 text-sm border-none outline-none placeholder:text-white/40"
          />
        </div>
      )}

      {/* Bottom Controls */}
      <div className="bg-black/90 px-4 pt-3 pb-6 space-y-3">
        {/* Color palette (text mode only) */}
        {tab === 'text' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {BG_COLORS.map(color => (
              <button
                key={color}
                onClick={() => setBgColor(color)}
                className={`w-8 h-8 rounded-full flex-shrink-0 border-2 transition-all ${bgColor === color ? 'border-white scale-110 ring-2 ring-white/30' : 'border-transparent'}`}
                style={{ backgroundColor: color }}
              />
            ))}
            <div className="relative flex-shrink-0">
              <input
                type="color"
                value={customColor}
                onChange={(e) => { setCustomColor(e.target.value); setBgColor(e.target.value); }}
                className="absolute inset-0 w-8 h-8 opacity-0 cursor-pointer"
              />
              <div
                className={`w-8 h-8 rounded-full border-2 transition-all ${!BG_COLORS.includes(bgColor) ? 'border-white scale-110' : 'border-white/30'}`}
                style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}
              />
            </div>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex items-center justify-center gap-1 bg-white/10 rounded-full p-1">
          <button
            onClick={() => setTab('text')}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium transition-all ${tab === 'text' ? 'bg-white text-black' : 'text-white/70 hover:text-white'}`}
          >
            <Type className="h-4 w-4" />
            Texto
          </button>
          <button
            onClick={switchToMedia}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium transition-all ${tab === 'media' ? 'bg-white text-black' : 'text-white/70 hover:text-white'}`}
          >
            <ImageIcon className="h-4 w-4" />
            Mídia
          </button>
        </div>
      </div>
    </div>
  );
};
