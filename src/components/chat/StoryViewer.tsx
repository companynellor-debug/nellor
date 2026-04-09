import { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, ChevronLeft, ChevronRight, Trash2, Eye, Loader2 } from 'lucide-react';
import { SupplierWithStories } from '@/hooks/useSupplierStories';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

interface StoryViewerProps {
  supplier: SupplierWithStories;
  onClose: () => void;
  onContact: (supplierId: string) => void;
  onViewed: (storyId: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
  onDelete?: (storyId: string) => void;
  isOwnStory?: boolean;
}

interface ViewerProfile {
  id: string;
  nome: string;
  foto_perfil_url: string | null;
  viewed_at: string;
}

const DEFAULT_STORY_DURATION = 5000;

export const StoryViewer = ({ supplier, onClose, onContact, onViewed, onPrev, onNext, onDelete, isOwnStory }: StoryViewerProps) => {
  const { user } = useSupabaseAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState<ViewerProfile[]>([]);
  const [viewCount, setViewCount] = useState(0);
  const [loadingViewers, setLoadingViewers] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const story = supplier.stories[currentIndex];
  const isMine = Boolean(isOwnStory || (user && supplier.supplierId === user.id));
  const isVideoStory = story?.type === 'video' && Boolean(story.media_url);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const fetchViewerData = async (storyId: string) => {
    const { data, error } = await supabase.rpc('get_story_views', { _story_id: storyId });
    if (error) throw error;

    const mapped = ((data as any[]) || []).map((item) => ({
      id: item.viewer_id,
      nome: item.viewer_name || 'Usuário',
      foto_perfil_url: item.viewer_photo || null,
      viewed_at: item.viewed_at,
    }));

    setViewers(mapped);
    setViewCount(mapped.length);
    return mapped;
  };

  useEffect(() => {
    setCurrentIndex(0);
    setProgress(0);
    setShowViewers(false);
  }, [supplier.supplierId]);

  useEffect(() => {
    clearTimer();
    setProgress(0);
    setShowViewers(false);
    setVideoReady(!isVideoStory);
    videoRef.current?.pause();

    if (!story) return;

    onViewed(story.id);

    if (isMine) {
      void fetchViewerData(story.id).catch(() => {
        setViewers([]);
        setViewCount(0);
      });
    } else {
      setViewers([]);
      setViewCount(0);
    }

    return () => clearTimer();
  }, [story?.id, isMine, isVideoStory, onViewed]);

  useEffect(() => {
    if (!story || showViewers || isVideoStory) return;

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / DEFAULT_STORY_DURATION) * 100, 100);
      setProgress(pct);

      if (pct >= 100) {
        clearTimer();
        if (currentIndex < supplier.stories.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          onNext ? onNext() : onClose();
        }
      }
    }, 50);

    return () => clearTimer();
  }, [story?.id, showViewers, isVideoStory, currentIndex, supplier.stories.length, onNext, onClose]);

  const openViewers = async () => {
    if (!story || !isMine) return;
    clearTimer();
    setShowViewers(true);
    setLoadingViewers(true);
    try {
      await fetchViewerData(story.id);
    } catch {
      setViewers([]);
      setViewCount(0);
    } finally {
      setLoadingViewers(false);
    }
  };

  const closeViewers = () => {
    setShowViewers(false);
  };

  const goLeft = () => {
    clearTimer();
    videoRef.current?.pause();
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
    else if (onPrev) onPrev();
  };

  const goRight = () => {
    clearTimer();
    videoRef.current?.pause();
    if (currentIndex < supplier.stories.length - 1) setCurrentIndex((prev) => prev + 1);
    else if (onNext) onNext();
    else onClose();
  };

  const handleDelete = async () => {
    if (!story || !onDelete) return;
    await onDelete(story.id);
    if (supplier.stories.length <= 1) {
      onClose();
      return;
    }
    if (currentIndex >= supplier.stories.length - 1) {
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  if (!story) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      <div className="absolute top-0 left-0 right-0 p-2 flex gap-1 z-10">
        {supplier.stories.map((_, i) => (
          <div key={i} className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-100"
              style={{ width: `${i < currentIndex ? 100 : i === currentIndex ? progress : 0}%` }}
            />
          </div>
        ))}
      </div>

      <div className="absolute top-6 left-0 right-0 px-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/50 flex-shrink-0">
            {supplier.supplierAvatar ? (
              <img src={supplier.supplierAvatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                {supplier.supplierName.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">{supplier.supplierName}</p>
            <p className="text-white/60 text-xs">
              {new Date(story.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isMine && onDelete && (
            <button onClick={handleDelete} className="p-2 text-white hover:bg-white/10 rounded-full">
              <Trash2 className="h-5 w-5" />
            </button>
          )}
          <button onClick={onClose} className="p-2 text-white hover:bg-white/10 rounded-full">
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      <button onClick={goLeft} className="absolute left-0 top-0 bottom-0 w-1/3 z-10" />
      <button onClick={goRight} className="absolute right-0 top-0 bottom-0 w-1/3 z-10" />

      <div className="w-full h-full flex items-center justify-center">
        {story.type === 'text' ? (
          <div className="w-full h-full flex items-center justify-center p-8" style={{ backgroundColor: story.bg_color || '#7c3aed' }}>
            <p className="text-white text-2xl font-bold text-center leading-relaxed max-w-md">{story.caption}</p>
          </div>
        ) : story.type === 'image' && story.media_url ? (
          <div className="w-full h-full relative">
            <img src={story.media_url} alt="" className="w-full h-full object-contain" />
            {story.caption && (
              <div className="absolute bottom-24 left-0 right-0 px-6">
                <p className="text-white text-center text-lg font-medium bg-black/40 rounded-xl px-4 py-3">{story.caption}</p>
              </div>
            )}
          </div>
        ) : story.type === 'video' && story.media_url ? (
          <div className="w-full h-full relative flex items-center justify-center bg-black">
            {!videoReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black z-[1]">
                <Loader2 className="h-8 w-8 animate-spin text-white/70" />
              </div>
            )}
            <video
              key={story.id}
              ref={videoRef}
              src={story.media_url}
              autoPlay
              playsInline
              muted
              preload="metadata"
              className="max-w-full max-h-full object-contain"
              onLoadedData={() => setVideoReady(true)}
              onCanPlay={(event) => {
                setVideoReady(true);
                void event.currentTarget.play().catch(() => undefined);
              }}
              onTimeUpdate={(event) => {
                const { currentTime, duration } = event.currentTarget;
                if (duration && Number.isFinite(duration) && duration > 0) {
                  setProgress(Math.min((currentTime / duration) * 100, 100));
                }
              }}
              onEnded={goRight}
            />
            {story.caption && (
              <div className="absolute bottom-24 left-0 right-0 px-6 z-[2]">
                <p className="text-white text-center text-lg font-medium bg-black/40 rounded-xl px-4 py-3">{story.caption}</p>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="absolute bottom-8 left-0 right-0 px-6 z-10">
        {isMine ? (
          <button
            onClick={openViewers}
            className="w-full flex items-center justify-center gap-2 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-full h-12 hover:bg-white/30 transition-colors"
          >
            <Eye className="h-5 w-5" />
            <span className="font-medium">{viewCount} visualizações · Ver quem viu</span>
          </button>
        ) : (
          <Button
            onClick={() => onContact(supplier.supplierId)}
            className="w-full bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/30 gap-2 rounded-full h-12"
          >
            <MessageCircle className="h-5 w-5" />
            Entrar em contato
          </Button>
        )}
      </div>

      {onPrev && (
        <button onClick={onPrev} className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/10 rounded-full hover:bg-white/20">
          <ChevronLeft className="h-6 w-6 text-white" />
        </button>
      )}
      {onNext && (
        <button onClick={onNext} className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/10 rounded-full hover:bg-white/20">
          <ChevronRight className="h-6 w-6 text-white" />
        </button>
      )}

      {showViewers && (
        <div className="absolute inset-x-0 bottom-0 z-20 bg-zinc-900 rounded-t-3xl max-h-[60vh] flex flex-col animate-in slide-in-from-bottom-10 duration-300">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h3 className="text-white font-semibold text-base">Visualizações ({viewCount})</h3>
            <button onClick={closeViewers} className="p-1.5 text-white/70 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingViewers ? (
              <div className="p-8 text-center text-white/50 text-sm">Carregando...</div>
            ) : viewers.length === 0 ? (
              <div className="p-8 text-center text-white/50 text-sm">Nenhuma visualização ainda</div>
            ) : (
              viewers.map((viewer) => (
                <div key={`${viewer.id}-${viewer.viewed_at}`} className="flex items-center gap-3 px-5 py-3 border-b border-white/5">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    {viewer.foto_perfil_url ? (
                      <img src={viewer.foto_perfil_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                        {viewer.nome.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{viewer.nome}</p>
                    <p className="text-white/40 text-xs">
                      {new Date(viewer.viewed_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
