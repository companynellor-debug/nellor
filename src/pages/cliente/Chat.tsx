import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Send, ArrowLeft, Paperclip, X, Video, FileText, Download, Handshake, AlertTriangle, Search, Pin } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { NegotiationForm } from "@/components/chat/NegotiationForm";
import { VerifiedSupplierBadge } from "@/components/cliente/VerifiedSupplierBadge";
import { SupplierStories } from "@/components/chat/SupplierStories";
import { StoryViewer } from "@/components/chat/StoryViewer";
import { SearchSuppliersSheet } from "@/components/chat/SearchSuppliersSheet";
import { useLocation, useNavigate } from "react-router-dom";
import { MessageAttachment } from "@/hooks/useMessages";
import { useSupabaseMessages } from "@/hooks/useSupabaseMessages";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "@/hooks/use-toast";
import { useSupabaseStores } from "@/hooks/useSupabaseStores";
import { useTypingPresence } from "@/hooks/useTypingPresence";
import { usePresence } from "@/hooks/usePresence";
import { useSupplierStories, SupplierWithStories } from "@/hooks/useSupplierStories";
import { supabase } from "@/integrations/supabase/client";

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const { stores } = useSupabaseStores();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [viewingImage, setViewingImage] = useState<{ url: string; name: string } | null>(null);
  const [showNegotiationForm, setShowNegotiationForm] = useState(false);
  const [messageLimitInfo, setMessageLimitInfo] = useState<{ allowed: boolean; remaining: number; verified: boolean; is_new_account?: boolean } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchSheet, setShowSearchSheet] = useState(false);
  const [viewingStorySupplier, setViewingStorySupplier] = useState<SupplierWithStories | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { sendMessage: sendSupabaseMessage, getConversations, getMessagesByUser, markAsRead, getUnreadCount } = useSupabaseMessages();
  const { isUserOnline, getLastSeenText, fetchLastSeen } = usePresence(user?.id);
  const { getGroupedStories, markAsViewed } = useSupplierStories();

  const chatId = selectedUserId && user?.id ? [user.id, selectedUserId].sort().join('_') : '';
  const { isOtherUserTyping, startTyping, stopTyping } = useTypingPresence(chatId, user?.id);

  const conversations = getConversations();
  const groupedStories = getGroupedStories();

  // Fetch last seen for all conversation partners
  useEffect(() => {
    const ids = conversations.map(c => c.userId);
    if (ids.length > 0) fetchLastSeen(ids);
  }, [conversations.length]);

  const handleDownloadImage = () => {
    if (!viewingImage) return;
    const link = document.createElement('a');
    link.href = viewingImage.url;
    link.download = viewingImage.name || 'imagem.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (location.state?.supplierId) {
      const supplierId = location.state.supplierId;
      const msg = location.state.message;
      setSelectedUserId(supplierId);
      markAsRead(supplierId);
      if (msg && user) {
        setTimeout(async () => {
          try {
            await sendSupabaseMessage(supplierId, msg);
            navigate('/cliente/chat', { state: { supplierId }, replace: true });
          } catch {
            toast({ title: "Erro ao enviar mensagem", variant: "destructive" });
          }
        }, 1000);
      }
    }
  }, [location.state, user]);

  useEffect(() => {
    if (!user) return;
    const checkLimit = async () => {
      try {
        const { data } = await supabase.rpc('check_chat_message_limit', { _user_id: user.id });
        if (data) setMessageLimitInfo(data as any);
      } catch (err) { console.error('Error checking message limit:', err); }
    };
    checkLimit();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedUserId, conversations]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newAttachments: MessageAttachment[] = [];
    for (const file of Array.from(files)) {
      const fileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file';
      if (file.size > 10 * 1024 * 1024) { toast({ title: `${file.name} excede 10MB`, variant: "destructive" }); continue; }
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.onerror = reject; reader.readAsDataURL(file);
        });
        newAttachments.push({ type: fileType, url: base64, name: file.name });
      } catch { toast({ title: `Erro ao processar ${file.name}`, variant: "destructive" }); }
    }
    if (newAttachments.length > 0) setAttachments(prev => [...prev, ...newAttachments]);
    e.target.value = '';
  };

  const removeAttachment = (index: number) => setAttachments(prev => prev.filter((_, i) => i !== index));

  const handleSend = () => {
    if (!selectedUserId) return;
    if (messageLimitInfo && !messageLimitInfo.allowed) { toast({ title: "Limite de mensagens atingido", variant: "destructive" }); return; }
    if (!message.trim() && attachments.length === 0) return;
    stopTyping();
    sendSupabaseMessage(selectedUserId, message.trim(), attachments.length > 0 ? attachments : undefined);
    setMessage("");
    setAttachments([]);
    if (messageLimitInfo?.is_new_account && !messageLimitInfo.verified) {
      setMessageLimitInfo(prev => prev ? { ...prev, remaining: Math.max(0, prev.remaining - 1), allowed: prev.remaining > 1 } : prev);
    }
  };

  const handleStoryClick = (supplierId: string) => {
    const supplier = groupedStories.find(s => s.supplierId === supplierId);
    if (supplier) setViewingStorySupplier(supplier);
  };

  const handleStoryContact = (supplierId: string) => {
    setViewingStorySupplier(null);
    setSelectedUserId(supplierId);
    markAsRead(supplierId);
  };

  const currentMessages = selectedUserId ? getMessagesByUser(selectedUserId) : [];
  const selectedSupplier = selectedUserId ? stores.find(s => s.id === selectedUserId) : null;

  const filteredConversations = useMemo(() => {
    if (!searchTerm) return conversations;
    return conversations.filter(conv => {
      const supplier = stores.find(s => s.id === conv.userId);
      return supplier?.nome?.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [conversations, searchTerm, stores]);

  // ============== CHAT VIEW ==============
  if (selectedUserId) {
    const supplierName = selectedSupplier?.nome || 'Fornecedor';
    const supplierAvatar = selectedSupplier?.foto_perfil_url || '/placeholder.svg';
    const presenceText = isOtherUserTyping ? 'Digitando...' : getLastSeenText(selectedUserId);

    return (
      <div className="fixed inset-0 z-[60] flex flex-col bg-background">
        {/* Header */}
        <header className="flex-shrink-0 bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg z-40">
          <div className="px-4 py-3 flex items-center gap-3">
            <button onClick={() => setSelectedUserId(null)} className="p-1.5 hover:bg-white/10 rounded-full"><ArrowLeft className="h-5 w-5" /></button>
            <div onClick={() => navigate(`/cliente/loja/${selectedUserId}`)} className="flex items-center gap-3 flex-1 cursor-pointer">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30">
                <img src={supplierAvatar} alt={supplierName} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-semibold text-sm truncate">{supplierName}</h2>
                  <VerifiedSupplierBadge verified={(selectedSupplier as any)?.verified !== false} />
                </div>
                <p className={`text-[11px] ${isOtherUserTyping ? 'animate-pulse' : 'opacity-80'}`}>{presenceText}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowNegotiationForm(true)} className="text-white hover:bg-white/10 gap-1 text-xs">
              <Handshake className="h-4 w-4" />
              <span className="hidden sm:inline">Negociar</span>
            </Button>
          </div>
        </header>

        <div className="relative z-[70]">
          <NegotiationForm supplierId={selectedUserId} open={showNegotiationForm} onOpenChange={setShowNegotiationForm} />
        </div>

        {/* Messages */}
        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gradient-to-b from-primary/5 to-background">
          {messageLimitInfo?.is_new_account && !messageLimitInfo.verified && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-orange-800">{messageLimitInfo.allowed ? `${messageLimitInfo.remaining} mensagens restantes` : "Limite atingido"} — verifique seu telefone.</p>
            </div>
          )}
          {currentMessages.length === 0 ? (
            <div className="text-center py-12"><p className="text-muted-foreground">Envie uma mensagem para começar</p></div>
          ) : (
            currentMessages.map((msg) => {
              const isFromMe = msg.from_user === user?.id;
              return (
                <div key={msg.id} className={`flex ${isFromMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 shadow-sm ${isFromMe ? "bg-primary text-white rounded-tr-md" : "bg-white border rounded-tl-md"}`}>
                    {msg.text && <p className="text-sm break-words whitespace-pre-wrap">{msg.text}</p>}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {msg.attachments.map((url, idx) => {
                          const isImage = url.startsWith('data:image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                          const isVideo = url.startsWith('data:video') || /\.(mp4|webm|ogg)$/i.test(url);
                          return (
                            <div key={idx}>
                              {isImage && <img src={url} alt="" className="max-w-full rounded-lg cursor-pointer" onClick={() => setViewingImage({ url, name: `anexo-${idx}` })} />}
                              {isVideo && <video src={url} controls className="max-w-full rounded-lg" />}
                              {!isImage && !isVideo && <a href={url} download className="flex items-center gap-2 p-2 bg-accent rounded-lg"><FileText className="h-4 w-4" /><span className="text-xs">Arquivo</span></a>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <p className={`text-[10px] mt-1 ${isFromMe ? 'text-white/70' : 'text-muted-foreground'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Input - in flex flow, not fixed */}
        <div className="flex-shrink-0 bg-white/95 backdrop-blur-lg border-t p-3 z-30">
          {attachments.length > 0 && (
            <div className="mb-2 flex gap-2 overflow-x-auto pb-2">
              {attachments.map((att, idx) => (
                <div key={idx} className="relative flex-shrink-0">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                    {att.type === 'image' ? <img src={att.url} alt="" className="w-full h-full object-cover" /> : att.type === 'video' ? <Video className="h-6 w-6 text-muted-foreground" /> : <FileText className="h-6 w-6 text-muted-foreground" />}
                  </div>
                  <button onClick={() => removeAttachment(idx)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5"><X className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx" multiple onChange={handleFileSelect} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-muted-foreground hover:text-foreground"><Paperclip className="h-5 w-5" /></button>
            <Input
              value={message}
              onChange={(e) => { setMessage(e.target.value); startTyping(); }}
              onBlur={stopTyping}
              onKeyPress={(e) => { if (e.key === "Enter" && !e.shiftKey) { stopTyping(); handleSend(); } }}
              placeholder="Mensagem..."
              className="flex-1 rounded-full bg-muted border-0"
            />
            <button onClick={handleSend} className="p-2.5 bg-primary text-white rounded-full hover:bg-primary/90 disabled:opacity-50" disabled={!message.trim() && attachments.length === 0}>
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Image viewer */}
        <Dialog open={!!viewingImage} onOpenChange={(open) => !open && setViewingImage(null)}>
          <DialogContent className="max-w-4xl w-full h-[90vh] p-0 bg-black/95">
            <div className="relative w-full h-full flex items-center justify-center">
              {viewingImage && (
                <>
                  <img src={viewingImage.url} alt="" className="max-w-full max-h-full object-contain" />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Button onClick={handleDownloadImage} className="bg-primary gap-2"><Download className="h-4 w-4" />Baixar</Button>
                    <Button variant="outline" onClick={() => setViewingImage(null)} className="bg-white/10 text-white border-white/20"><X className="h-4 w-4" /></Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ============== CONVERSATIONS LIST ==============
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold">Mensagens</h1>
          <p className="text-xs text-white/70">{conversations.length} conversas ativas</p>
        </div>
      </header>

      {/* Search */}
      <div className="px-4 py-2 bg-white sticky top-[68px] z-30 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Pesquisar conversas..." className="pl-9 rounded-full bg-muted border-0 h-9" />
        </div>
      </div>

      {/* Stories */}
      {(groupedStories.length > 0 || true) && (
        <div className="bg-white border-b">
          <SupplierStories suppliers={groupedStories} onStoryClick={handleStoryClick} onSearchClick={() => setShowSearchSheet(true)} />
        </div>
      )}

      {/* Conversations */}
      <div className="divide-y">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-muted-foreground">Nenhuma conversa ainda</p>
            <p className="text-sm text-muted-foreground mt-2">Use a busca acima para encontrar fornecedores</p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const supplier = stores.find(s => s.id === conv.userId);
            if (!supplier) return null;
            const online = isUserOnline(conv.userId);
            return (
              <div
                key={conv.userId}
                onClick={() => { setSelectedUserId(conv.userId); markAsRead(conv.userId); }}
                className="px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors active:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-full overflow-hidden">
                      <img src={supplier.foto_perfil_url || '/placeholder.svg'} alt={supplier.nome} className="w-full h-full object-cover" />
                    </div>
                    {online && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="font-semibold truncate text-[15px]">{supplier.nome}</h3>
                      <span className="text-[11px] text-muted-foreground flex-shrink-0 ml-2">
                        {new Date(conv.lastMessage.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate pr-2">{conv.lastMessage.text || 'Anexo'}</p>
                      {conv.unreadCount > 0 && (
                        <span className="bg-primary text-white text-[11px] rounded-full h-5 min-w-5 flex items-center justify-center px-1.5 flex-shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Story Viewer */}
      {viewingStorySupplier && (
        <StoryViewer
          supplier={viewingStorySupplier}
          onClose={() => setViewingStorySupplier(null)}
          onContact={handleStoryContact}
          onViewed={markAsViewed}
        />
      )}

      {/* Search Suppliers Sheet */}
      <SearchSuppliersSheet
        open={showSearchSheet}
        onOpenChange={setShowSearchSheet}
        onSelectSupplier={(id) => { setSelectedUserId(id); markAsRead(id); }}
      />

      <BottomNav />
    </div>
  );
};

export default Chat;
