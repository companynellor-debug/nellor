import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Send, Paperclip, X, Download, Video, FileText, ArrowLeft, Search, Check, CheckCheck, Plus } from "lucide-react";
import { MessageAttachment } from "@/hooks/useMessages";
import { useSupabaseMessages } from "@/hooks/useSupabaseMessages";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { usePresence } from "@/hooks/usePresence";
import { useSupplierStories, SupplierWithStories } from "@/hooks/useSupplierStories";
import { SupplierStories } from "@/components/chat/SupplierStories";
import { StoryViewer } from "@/components/chat/StoryViewer";
import { CreateStoryModal } from "@/components/chat/CreateStoryModal";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTypingPresence } from "@/hooks/useTypingPresence";

interface CustomerProfile {
  id: string;
  nome: string;
  foto_perfil_url: string | null;
}

const ChatFornecedor = () => {
  const { user } = useSupabaseAuth();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [viewingImage, setViewingImage] = useState<{ url: string; name: string } | null>(null);
  const [customerProfiles, setCustomerProfiles] = useState<Record<string, CustomerProfile>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showSearchActive, setShowSearchActive] = useState(false);
  const [viewingStorySupplier, setViewingStorySupplier] = useState<SupplierWithStories | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { sendMessage: sendSupabaseMessage, getConversations, getMessagesByUser, markAsRead } = useSupabaseMessages(user?.id);
  const { isUserOnline, getLastSeenText, fetchLastSeen } = usePresence(user?.id);
  const { getGroupedStories, markAsViewed, createStory, deleteStory, getMyStories } = useSupplierStories();

  const chatId = selectedCustomerId && user?.id ? [user.id, selectedCustomerId].sort().join('_') : '';
  const { isOtherUserTyping, startTyping, stopTyping } = useTypingPresence(chatId, user?.id);

  const conversations = getConversations();
  const messages = selectedCustomerId ? getMessagesByUser(selectedCustomerId) : [];
  const myStories = getMyStories();
  const groupedStories = getGroupedStories();

  // Fetch customer profiles - track conversation user IDs as a string key to avoid stale closures
  const conversationUserIds = conversations.map(c => c.userId).sort().join(',');
  useEffect(() => {
    if (!conversationUserIds) return;
    const ids = conversationUserIds.split(',');
    const fetchAll = async () => {
      try {
        const { data, error } = await supabase.rpc('get_chat_participant_profiles', { _user_ids: ids });
        if (error) throw error;
        const newProfiles: Record<string, CustomerProfile> = {};
        (data as any[] || []).forEach((profile: any) => { newProfiles[profile.id] = { id: profile.id, nome: profile.nome, foto_perfil_url: profile.foto_perfil_url }; });
        setCustomerProfiles(prev => {
          const merged = { ...prev, ...newProfiles };
          const changed = ids.some(id => prev[id]?.nome !== merged[id]?.nome || prev[id]?.foto_perfil_url !== merged[id]?.foto_perfil_url);
          return changed ? merged : prev;
        });
      } catch (error) { console.error('Error fetching customer profiles:', error); }
    };
    fetchAll();
  }, [conversationUserIds]);

  // Fetch last seen
  useEffect(() => {
    const ids = conversations.map(c => c.userId);
    if (ids.length > 0) fetchLastSeen(ids);
  }, [conversations.length]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (selectedCustomerId) markAsRead(selectedCustomerId); }, [selectedCustomerId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newAttachments: MessageAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} é muito grande (max 10MB)`); continue; }
      const reader = new FileReader();
      await new Promise((resolve) => {
        reader.onload = (e) => {
          const url = e.target?.result as string;
          let type: 'image' | 'video' | 'file' = 'file';
          if (file.type.startsWith('image/')) type = 'image';
          else if (file.type.startsWith('video/')) type = 'video';
          newAttachments.push({ type, url, name: file.name });
          resolve(null);
        };
        reader.readAsDataURL(file);
      });
    }
    setAttachments(prev => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => setAttachments(prev => prev.filter((_, i) => i !== index));

  const handleDownloadImage = () => {
    if (!viewingImage) return;
    const link = document.createElement('a');
    link.href = viewingImage.url;
    link.download = viewingImage.name || 'imagem.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSend = () => {
    if (!message.trim() && attachments.length === 0) return;
    if (!selectedCustomerId) return;
    stopTyping();
    sendSupabaseMessage(selectedCustomerId, message, attachments);
    setMessage("");
    setAttachments([]);
  };

  const getCustomerName = (userId: string) => customerProfiles[userId]?.nome || 'Cliente';
  const getCustomerAvatar = (userId: string) => customerProfiles[userId]?.foto_perfil_url;

  const filteredConversations = conversations.filter(conv => {
    const name = getCustomerName(conv.userId).toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  // ============== CHAT VIEW (Mobile) ==============
  if (selectedCustomerId) {
    const customerName = getCustomerName(selectedCustomerId);
    const customerAvatar = getCustomerAvatar(selectedCustomerId);
    const presenceText = isOtherUserTyping ? 'digitando...' : getLastSeenText(selectedCustomerId);
    const online = isUserOnline(selectedCustomerId);

    const renderMessages = () => (
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gradient-to-b from-primary/5 to-background">
        {messages.map((msg, idx) => {
          const isFromMe = msg.from_user === user?.id;
          return (
            <div key={idx} className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] rounded-2xl px-3 py-2 shadow-sm ${isFromMe ? 'bg-primary text-white rounded-tr-md' : 'bg-white border rounded-tl-md'}`}>
                {msg.text && <p className="text-sm break-words whitespace-pre-wrap">{msg.text}</p>}
                {msg.attachments && msg.attachments.map((url, attIdx) => {
                  const isImage = url.startsWith('data:image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                  const isVideo = url.startsWith('data:video') || /\.(mp4|webm|ogg)$/i.test(url);
                  return (
                    <div key={attIdx} className="mt-1 rounded-lg overflow-hidden">
                      {isImage && <img src={url} alt="" className="max-w-full rounded-lg cursor-pointer" onClick={() => setViewingImage({ url, name: `anexo-${attIdx}` })} />}
                      {isVideo && <video controls className="max-w-full rounded-lg"><source src={url} /></video>}
                      {!isImage && !isVideo && <a href={url} download className="flex items-center gap-2 p-2 bg-black/5 rounded-lg"><FileText className="h-5 w-5 text-primary" /><span className="text-sm">Arquivo</span></a>}
                    </div>
                  );
                })}
                <div className={`flex items-center gap-1 mt-1 ${isFromMe ? 'justify-end' : 'justify-start'}`}>
                  <span className={`text-[10px] ${isFromMe ? 'text-white/70' : 'text-muted-foreground'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isFromMe && (msg.read ? <CheckCheck className="h-3 w-3 text-white/80" /> : <Check className="h-3 w-3 text-white/50" />)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    );

    const renderInput = () => (
      <div className="bg-background/95 backdrop-blur-xl px-3 pt-2 pb-[max(env(safe-area-inset-bottom),0.75rem)] flex items-center gap-2 border-t shadow-[0_-8px_24px_hsl(var(--foreground)/0.06)]">
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple accept="image/*,video/*,.pdf,.doc,.docx" />
        <button onClick={() => fileInputRef.current?.click()} className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"><Paperclip className="h-5 w-5" /></button>
        <Input
          placeholder="Mensagem..."
          value={message}
          onChange={(e) => { setMessage(e.target.value); startTyping(); }}
          onBlur={stopTyping}
          onKeyPress={(e) => { if (e.key === 'Enter') { stopTyping(); handleSend(); } }}
          className="flex-1 rounded-full bg-muted border-0 h-11"
        />
        <button onClick={handleSend} disabled={!message.trim() && attachments.length === 0} className="p-2.5 bg-primary text-white rounded-full disabled:opacity-50 hover:bg-primary/90 shadow-sm">
          <Send className="h-5 w-5" />
        </button>
      </div>
    );

    const renderHeader = () => (
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-3 flex items-center gap-3 shadow-lg">
        <button onClick={() => setSelectedCustomerId(null)} className="p-1.5 hover:bg-white/10 rounded-full"><ArrowLeft className="h-5 w-5" /></button>
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30">
            {customerAvatar ? <img src={customerAvatar} alt="" className="w-full h-full object-cover" /> : (
              <div className="w-full h-full flex items-center justify-center bg-white/20 font-bold text-lg">{customerName.charAt(0)}</div>
            )}
          </div>
          {online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{customerName}</p>
          <p className={`text-[11px] ${isOtherUserTyping ? 'animate-pulse' : 'opacity-70'}`}>{presenceText}</p>
        </div>
      </div>
    );

    return (
      <>
        {/* Mobile — fixed fullscreen to escape layout padding/nav */}
        <div className="md:hidden fixed inset-0 z-[60] flex flex-col bg-background">
          {renderHeader()}
          {attachments.length > 0 && (
            <div className="bg-background border-t p-2 flex gap-2 overflow-x-auto flex-shrink-0">
              {attachments.map((att, idx) => (
                <div key={idx} className="relative flex-shrink-0">
                  {att.type === 'image' ? <img src={att.url} alt="" className="h-16 w-16 object-cover rounded-xl" /> : <div className="h-16 w-16 bg-muted rounded-xl flex items-center justify-center">{att.type === 'video' ? <Video className="h-6 w-6" /> : <FileText className="h-6 w-6" />}</div>}
                  <button onClick={() => removeAttachment(idx)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          )}
          {renderMessages()}
          <div className="flex-shrink-0">{renderInput()}</div>
        </div>

        {/* Desktop */}
        <div className="hidden md:flex h-[calc(100vh-8rem)] gap-4">
          <Card className="w-80 flex-shrink-0 flex flex-col overflow-hidden">
            <div className="p-4 border-b bg-gradient-to-r from-primary to-primary/80 text-white"><h2 className="font-semibold text-lg">Conversas</h2></div>
            <div className="p-2 border-b">
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-muted border-0 rounded-full" /></div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y">
              {filteredConversations.map((conv) => {
                const convOnline = isUserOnline(conv.userId);
                return (
                  <div key={conv.userId} onClick={() => setSelectedCustomerId(conv.userId)} className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${selectedCustomerId === conv.userId ? 'bg-muted' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden">
                          {getCustomerAvatar(conv.userId) ? <img src={getCustomerAvatar(conv.userId)!} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary text-white font-bold text-lg">{getCustomerName(conv.userId).charAt(0)}</div>}
                        </div>
                        {convOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between"><h3 className="font-semibold truncate">{getCustomerName(conv.userId)}</h3><span className="text-[11px] text-muted-foreground">{new Date(conv.lastMessage.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span></div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-sm text-muted-foreground truncate">{conv.lastMessage.text || 'Anexo'}</p>
                          {conv.unreadCount > 0 && <span className="bg-primary text-white text-[11px] rounded-full h-5 min-w-5 flex items-center justify-center px-1.5">{conv.unreadCount}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="flex-1 flex flex-col overflow-hidden">
            {renderHeader()}
            {renderMessages()}
            {attachments.length > 0 && (
              <div className="border-t p-3 bg-white flex gap-2 overflow-x-auto">
                {attachments.map((att, idx) => (
                  <div key={idx} className="relative flex-shrink-0">
                    {att.type === 'image' ? <img src={att.url} alt="" className="h-20 w-20 object-cover rounded-xl" /> : <div className="h-20 w-20 bg-muted rounded-xl flex items-center justify-center">{att.type === 'video' ? <Video className="h-8 w-8" /> : <FileText className="h-8 w-8" />}</div>}
                    <button onClick={() => removeAttachment(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            )}
            {renderInput()}
          </Card>
        </div>

        {/* Image Viewer */}
        <Dialog open={!!viewingImage} onOpenChange={(o) => !o && setViewingImage(null)}>
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
      </>
    );
  }

  // ============== CONVERSATIONS LIST ==============
  return (
    <>
      {/* Mobile */}
      <div className="md:hidden min-h-screen bg-white">
        <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-4 sticky top-0 z-10 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Conversas</h1>
            <p className="text-xs text-white/70">{conversations.length} conversas</p>
          </div>
          <button onClick={() => setShowCreateStory(true)} className="p-2 hover:bg-white/10 rounded-full"><Plus className="h-5 w-5" /></button>
        </div>

        <div className="p-2 bg-white sticky top-[68px] z-10 border-b">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-muted border-0 rounded-full h-9" /></div>
        </div>

        {/* My Stories */}
        <div className="bg-white border-b">
          <SupplierStories
            suppliers={groupedStories.filter(s => s.supplierId !== user?.id)}
            onStoryClick={(id) => {
              const s = groupedStories.find(g => g.supplierId === id);
              if (s) setViewingStorySupplier(s);
            }}
            onSearchClick={() => {}}
            showAddButton
            onAddClick={() => {
              if (myStories.length > 0) {
                const myGroup = groupedStories.find(g => g.supplierId === user?.id);
                if (myGroup) setViewingStorySupplier(myGroup);
                else setShowCreateStory(true);
              } else {
                setShowCreateStory(true);
              }
            }}
            myStories={myStories}
          />
        </div>

        <div className="divide-y pb-20">
          {showSearchActive && (
            <div className="px-4 py-2 border-b bg-muted/30 text-xs text-muted-foreground">A busca filtra as conversas pelo nome real do cliente.</div>
          )}
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground"><p className="text-lg">Nenhuma conversa</p><p className="text-sm mt-2">Mensagens dos clientes aparecerão aqui</p></div>
          ) : (
            filteredConversations.map((conv) => {
              const online = isUserOnline(conv.userId);
              return (
                <div key={conv.userId} onClick={() => setSelectedCustomerId(conv.userId)} className="p-4 cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 rounded-full overflow-hidden">
                        {getCustomerAvatar(conv.userId) ? <img src={getCustomerAvatar(conv.userId)!} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary text-white font-bold text-xl">{getCustomerName(conv.userId).charAt(0)}</div>}
                      </div>
                      {online && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="font-semibold truncate text-[15px]">{getCustomerName(conv.userId)}</h3>
                        <span className="text-[11px] text-muted-foreground">{new Date(conv.lastMessage.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate pr-2">
                          {conv.lastMessage.from_user === user?.id && <span className="inline-flex mr-1">{conv.lastMessage.read ? <CheckCheck className="h-4 w-4 text-primary" /> : <Check className="h-4 w-4 text-muted-foreground" />}</span>}
                          {conv.lastMessage.text || 'Anexo'}
                        </p>
                        {conv.unreadCount > 0 && <span className="bg-primary text-white text-[11px] rounded-full h-5 min-w-5 flex items-center justify-center px-1.5 flex-shrink-0">{conv.unreadCount}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:flex h-[calc(100vh-8rem)] gap-4">
        <Card className="w-80 flex-shrink-0 flex flex-col overflow-hidden">
          <div className="p-4 border-b bg-gradient-to-r from-primary to-primary/80 text-white flex items-center justify-between">
            <h2 className="font-semibold text-lg">Conversas</h2>
            <button onClick={() => {
              if (myStories.length > 0) {
                const myGroup = groupedStories.find(g => g.supplierId === user?.id);
                if (myGroup) setViewingStorySupplier(myGroup);
                else setShowCreateStory(true);
              } else {
                setShowCreateStory(true);
              }
            }} className="p-1.5 hover:bg-white/10 rounded-full"><Plus className="h-5 w-5" /></button>
          </div>
          <div className="border-b bg-card">
            <SupplierStories
              suppliers={groupedStories.filter(s => s.supplierId !== user?.id)}
              onStoryClick={(id) => {
                const s = groupedStories.find(g => g.supplierId === id);
                if (s) setViewingStorySupplier(s);
              }}
              onSearchClick={() => setShowSearchActive((prev) => !prev)}
              showAddButton
              onAddClick={() => {
                if (myStories.length > 0) {
                  const myGroup = groupedStories.find(g => g.supplierId === user?.id);
                  if (myGroup) setViewingStorySupplier(myGroup);
                  else setShowCreateStory(true);
                } else {
                  setShowCreateStory(true);
                }
              }}
              myStories={myStories}
            />
          </div>
          <div className="p-2 border-b">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Pesquisar clientes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-muted border-0 rounded-full" /></div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y">
            {filteredConversations.map((conv) => {
              const online = isUserOnline(conv.userId);
              return (
                <div key={conv.userId} onClick={() => setSelectedCustomerId(conv.userId)} className="p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden">{getCustomerAvatar(conv.userId) ? <img src={getCustomerAvatar(conv.userId)!} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary text-white font-bold text-lg">{getCustomerName(conv.userId).charAt(0)}</div>}</div>
                      {online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between"><h3 className="font-semibold truncate">{getCustomerName(conv.userId)}</h3><span className="text-[11px] text-muted-foreground">{new Date(conv.lastMessage.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span></div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-sm text-muted-foreground truncate">{conv.lastMessage.text || 'Anexo'}</p>
                        {conv.unreadCount > 0 && <span className="bg-primary text-white text-[11px] rounded-full h-5 min-w-5 flex items-center justify-center px-1.5">{conv.unreadCount}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card className="flex-1 flex items-center justify-center bg-muted/30">
          <div className="text-center text-muted-foreground">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center"><Send className="h-10 w-10 text-muted-foreground/50" /></div>
            <h3 className="text-xl font-medium mb-2">Suas conversas</h3>
            <p className="text-sm">Selecione uma conversa para ver as mensagens</p>
          </div>
        </Card>
      </div>

      {/* Story Viewer */}
      {viewingStorySupplier && (
        <StoryViewer supplier={viewingStorySupplier} onClose={() => setViewingStorySupplier(null)} onContact={(id) => { setViewingStorySupplier(null); setSelectedCustomerId(id); }} onViewed={markAsViewed} onDelete={deleteStory} isOwnStory={viewingStorySupplier.supplierId === user?.id} />
      )}

      {/* Create Story Modal */}
      <CreateStoryModal open={showCreateStory} onOpenChange={setShowCreateStory} onCreateStory={createStory} />
    </>
  );
};

export default ChatFornecedor;
