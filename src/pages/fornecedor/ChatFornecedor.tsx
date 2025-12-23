import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Send, Paperclip, X, Download, Video, FileText, ArrowLeft, Search, Check, CheckCheck } from "lucide-react";
import { MessageAttachment } from "@/hooks/useMessages";
import { useSupabaseMessages } from "@/hooks/useSupabaseMessages";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { 
    sendMessage: sendSupabaseMessage, 
    getConversations, 
    getMessagesByUser,
    markAsRead
  } = useSupabaseMessages(user?.id);

  const chatId = selectedCustomerId && user?.id ? [user.id, selectedCustomerId].sort().join('_') : '';
  const { isOtherUserTyping, startTyping, stopTyping } = useTypingPresence(chatId, user?.id);

  const conversations = getConversations();
  const messages = selectedCustomerId ? getMessagesByUser(selectedCustomerId) : [];

  // Fetch customer profiles
  useEffect(() => {
    const fetchCustomerProfiles = async () => {
      if (conversations.length === 0) return;
      
      const customerIds = conversations.map(c => c.userId);
      const missingIds = customerIds.filter(id => !customerProfiles[id]);
      
      if (missingIds.length === 0) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, nome, foto_perfil_url')
          .in('id', missingIds);

        if (error) throw error;
        
        const newProfiles: Record<string, CustomerProfile> = {};
        data?.forEach(profile => {
          newProfiles[profile.id] = profile;
        });
        
        setCustomerProfiles(prev => ({ ...prev, ...newProfiles }));
      } catch (error) {
        console.error('Error fetching customer profiles:', error);
      }
    };

    fetchCustomerProfiles();
  }, [conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedCustomerId) {
      markAsRead(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: MessageAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} é muito grande. Tamanho máximo: 10MB`);
        continue;
      }

      const reader = new FileReader();
      await new Promise((resolve) => {
        reader.onload = (e) => {
          const url = e.target?.result as string;
          let type: 'image' | 'video' | 'file' = 'file';

          if (file.type.startsWith('image/')) type = 'image';
          else if (file.type.startsWith('video/')) type = 'video';

          newAttachments.push({
            type,
            url,
            name: file.name,
          });
          resolve(null);
        };
        reader.readAsDataURL(file);
      });
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    toast.success(`${newAttachments.length} arquivo(s) adicionado(s)`);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleDownloadImage = () => {
    if (!viewingImage) return;
    
    const link = document.createElement('a');
    link.href = viewingImage.url;
    link.download = viewingImage.name || 'imagem.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Download iniciado");
  };

  const handleSend = () => {
    if (!message.trim() && attachments.length === 0) return;
    if (!selectedCustomerId) return;

    stopTyping();
    sendSupabaseMessage(selectedCustomerId, message, attachments);
    setMessage("");
    setAttachments([]);
  };

  const getCustomerName = (userId: string) => {
    return customerProfiles[userId]?.nome || 'Cliente';
  };

  const getCustomerAvatar = (userId: string) => {
    return customerProfiles[userId]?.foto_perfil_url;
  };

  const filteredConversations = conversations.filter(conv => {
    const name = getCustomerName(conv.userId).toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  const selectedCustomer = selectedCustomerId ? customerProfiles[selectedCustomerId] : null;

  // Mobile: Show chat view
  if (selectedCustomerId) {
    return (
      <>
        {/* Mobile Chat View */}
        <div className="md:hidden flex flex-col h-[calc(100vh-4rem)] bg-[#ece5dd]">
          {/* Header */}
          <div className="bg-[#075e54] text-white p-3 flex items-center gap-3 shadow-md">
            <button 
              onClick={() => setSelectedCustomerId(null)} 
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
              {getCustomerAvatar(selectedCustomerId) ? (
                <img 
                  src={getCustomerAvatar(selectedCustomerId)!} 
                  alt="" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-400 to-gray-500 text-white font-bold text-lg">
                  {getCustomerName(selectedCustomerId).charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{getCustomerName(selectedCustomerId)}</p>
              {isOtherUserTyping ? (
                <p className="text-xs text-green-200 animate-pulse">digitando...</p>
              ) : (
                <p className="text-xs text-green-100">online</p>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((msg, idx) => {
              const isFromMe = msg.from_user === user?.id;
              return (
                <div
                  key={idx}
                  className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-lg px-3 py-2 shadow-sm relative ${
                      isFromMe
                        ? 'bg-[#dcf8c6] rounded-tr-none'
                        : 'bg-white rounded-tl-none'
                    }`}
                  >
                    {msg.text && (
                      <p className="text-sm break-words whitespace-pre-wrap">{msg.text}</p>
                    )}
                    
                    {msg.attachments && msg.attachments.map((attachmentUrl, attIdx) => {
                      const isImage = attachmentUrl.startsWith('data:image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(attachmentUrl);
                      const isVideo = attachmentUrl.startsWith('data:video') || /\.(mp4|webm|ogg)$/i.test(attachmentUrl);
                      
                      return (
                        <div key={attIdx} className="mt-1 rounded-lg overflow-hidden">
                          {isImage && (
                            <img 
                              src={attachmentUrl} 
                              alt="Anexo"
                              className="max-w-full h-auto rounded-lg cursor-pointer"
                              onClick={() => setViewingImage({ url: attachmentUrl, name: `anexo-${attIdx}` })}
                            />
                          )}
                          {isVideo && (
                            <video controls className="max-w-full h-auto rounded-lg">
                              <source src={attachmentUrl} />
                            </video>
                          )}
                          {!isImage && !isVideo && (
                            <a
                              href={attachmentUrl}
                              download={`arquivo-${attIdx}`}
                              className="flex items-center gap-2 p-2 bg-black/5 rounded-lg"
                            >
                              <FileText className="h-5 w-5 text-[#075e54]" />
                              <span className="text-sm">Arquivo anexo</span>
                            </a>
                          )}
                        </div>
                      );
                    })}
                    
                    <div className={`flex items-center gap-1 mt-1 ${isFromMe ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[10px] text-gray-500">
                        {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isFromMe && (
                        msg.read ? (
                          <CheckCheck className="h-3 w-3 text-[#53bdeb]" />
                        ) : (
                          <Check className="h-3 w-3 text-gray-400" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="bg-white border-t p-2">
              <div className="flex gap-2 overflow-x-auto">
                {attachments.map((att, idx) => (
                  <div key={idx} className="relative flex-shrink-0">
                    {att.type === 'image' ? (
                      <img src={att.url} alt={att.name} className="h-16 w-16 object-cover rounded-lg" />
                    ) : (
                      <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        {att.type === 'video' ? <Video className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                      </div>
                    )}
                    <button
                      onClick={() => removeAttachment(idx)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="bg-[#f0f0f0] p-2 flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <Paperclip className="h-6 w-6" />
            </button>
            <Input
              placeholder="Mensagem"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                startTyping();
              }}
              onBlur={stopTyping}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  stopTyping();
                  handleSend();
                }
              }}
              className="flex-1 rounded-full bg-white border-0"
            />
            <button 
              onClick={handleSend}
              disabled={!message.trim() && attachments.length === 0}
              className="p-2 bg-[#075e54] text-white rounded-full disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden md:flex h-[calc(100vh-8rem)] gap-4">
          {/* Conversations List */}
          <Card className="w-80 flex-shrink-0 flex flex-col overflow-hidden">
            <div className="p-4 border-b bg-[#075e54] text-white">
              <h2 className="font-semibold text-lg">Conversas</h2>
            </div>
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Pesquisar conversas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-gray-100 border-0"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p>Nenhuma conversa</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.userId}
                    onClick={() => setSelectedCustomerId(conv.userId)}
                    className={`p-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedCustomerId === conv.userId ? 'bg-gray-100' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                        {getCustomerAvatar(conv.userId) ? (
                          <img 
                            src={getCustomerAvatar(conv.userId)!} 
                            alt="" 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#075e54] to-[#128c7e] text-white font-bold text-lg">
                            {getCustomerName(conv.userId).charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold truncate">{getCustomerName(conv.userId)}</h3>
                          <span className="text-xs text-muted-foreground">
                            {new Date(conv.lastMessage.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-sm text-muted-foreground truncate">{conv.lastMessage.text}</p>
                          {conv.unreadCount > 0 && (
                            <span className="bg-[#25d366] text-white text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1.5">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Chat Area */}
          <Card className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-[#075e54] text-white p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                {getCustomerAvatar(selectedCustomerId) ? (
                  <img 
                    src={getCustomerAvatar(selectedCustomerId)!} 
                    alt="" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-400 to-gray-500 text-white font-bold">
                    {getCustomerName(selectedCustomerId).charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold">{getCustomerName(selectedCustomerId)}</p>
                {isOtherUserTyping ? (
                  <p className="text-xs text-green-200 animate-pulse">digitando...</p>
                ) : (
                  <p className="text-xs text-green-100">online</p>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#ece5dd]">
              {messages.map((msg, idx) => {
                const isFromMe = msg.from_user === user?.id;
                return (
                  <div
                    key={idx}
                    className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[65%] rounded-lg px-3 py-2 shadow-sm ${
                        isFromMe
                          ? 'bg-[#dcf8c6] rounded-tr-none'
                          : 'bg-white rounded-tl-none'
                      }`}
                    >
                      {msg.text && (
                        <p className="text-sm break-words">{msg.text}</p>
                      )}
                      
                      {msg.attachments && msg.attachments.map((attachmentUrl, attIdx) => {
                        const isImage = attachmentUrl.startsWith('data:image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(attachmentUrl);
                        const isVideo = attachmentUrl.startsWith('data:video') || /\.(mp4|webm|ogg)$/i.test(attachmentUrl);
                        
                        return (
                          <div key={attIdx} className="mt-1 rounded-lg overflow-hidden">
                            {isImage && (
                              <img 
                                src={attachmentUrl} 
                                alt="Anexo"
                                className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90"
                                onClick={() => setViewingImage({ url: attachmentUrl, name: `anexo-${attIdx}` })}
                              />
                            )}
                            {isVideo && (
                              <video controls className="max-w-full h-auto rounded-lg">
                                <source src={attachmentUrl} />
                              </video>
                            )}
                            {!isImage && !isVideo && (
                              <a
                                href={attachmentUrl}
                                download={`arquivo-${attIdx}`}
                                className="flex items-center gap-2 p-2 bg-black/5 rounded-lg hover:bg-black/10"
                              >
                                <FileText className="h-5 w-5 text-[#075e54]" />
                                <span className="text-sm">Arquivo anexo</span>
                              </a>
                            )}
                          </div>
                        );
                      })}
                      
                      <div className={`flex items-center gap-1 mt-1 ${isFromMe ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[10px] text-gray-500">
                          {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isFromMe && (
                          msg.read ? (
                            <CheckCheck className="h-3 w-3 text-[#53bdeb]" />
                          ) : (
                            <Check className="h-3 w-3 text-gray-400" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Attachments Preview */}
            {attachments.length > 0 && (
              <div className="border-t p-3 bg-white">
                <div className="flex gap-2 overflow-x-auto">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="relative flex-shrink-0">
                      {att.type === 'image' ? (
                        <img src={att.url} alt={att.name} className="h-20 w-20 object-cover rounded-lg" />
                      ) : (
                        <div className="h-20 w-20 bg-gray-100 rounded-lg flex items-center justify-center">
                          {att.type === 'video' ? <Video className="h-8 w-8" /> : <FileText className="h-8 w-8" />}
                        </div>
                      )}
                      <button
                        onClick={() => removeAttachment(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="bg-[#f0f0f0] p-3 flex items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-200"
              >
                <Paperclip className="h-6 w-6" />
              </button>
              <Input
                placeholder="Digite uma mensagem"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  startTyping();
                }}
                onBlur={stopTyping}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    stopTyping();
                    handleSend();
                  }
                }}
                className="flex-1 rounded-full bg-white border-0"
              />
              <button 
                onClick={handleSend}
                disabled={!message.trim() && attachments.length === 0}
                className="p-3 bg-[#075e54] text-white rounded-full disabled:opacity-50 hover:bg-[#064e46]"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </Card>
        </div>

        {/* Image Viewer Modal */}
        <Dialog open={!!viewingImage} onOpenChange={(open) => !open && setViewingImage(null)}>
          <DialogContent className="max-w-4xl w-full h-[90vh] p-0 bg-black/95">
            <div className="relative w-full h-full flex items-center justify-center">
              {viewingImage && (
                <>
                  <img 
                    src={viewingImage.url} 
                    alt={viewingImage.name}
                    className="max-w-full max-h-full object-contain"
                  />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Button onClick={handleDownloadImage} className="bg-[#075e54] hover:bg-[#064e46] gap-2">
                      <Download className="h-4 w-4" />
                      Baixar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setViewingImage(null)}
                      className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Conversations List View (Mobile + Desktop without selection)
  return (
    <>
      {/* Mobile Conversations List */}
      <div className="md:hidden min-h-screen bg-white">
        {/* Header */}
        <div className="bg-[#075e54] text-white p-4 sticky top-0 z-10">
          <h1 className="text-xl font-bold">Conversas</h1>
          <p className="text-sm text-green-100">{conversations.length} conversas</p>
        </div>

        {/* Search */}
        <div className="p-2 bg-white sticky top-[72px] z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-gray-100 border-0 rounded-full"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="divide-y pb-20">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-lg">Nenhuma conversa ainda</p>
              <p className="text-sm mt-2">As mensagens dos clientes aparecerão aqui</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.userId}
                onClick={() => setSelectedCustomerId(conv.userId)}
                className="p-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
                    {getCustomerAvatar(conv.userId) ? (
                      <img 
                        src={getCustomerAvatar(conv.userId)!} 
                        alt="" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#075e54] to-[#128c7e] text-white font-bold text-xl">
                        {getCustomerName(conv.userId).charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold truncate text-base">{getCustomerName(conv.userId)}</h3>
                      <span className="text-xs text-muted-foreground">
                        {new Date(conv.lastMessage.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate pr-2">
                        {conv.lastMessage.from_user === user?.id && (
                          <span className="inline-flex mr-1">
                            {conv.lastMessage.read ? (
                              <CheckCheck className="h-4 w-4 text-[#53bdeb]" />
                            ) : (
                              <Check className="h-4 w-4 text-gray-400" />
                            )}
                          </span>
                        )}
                        {conv.lastMessage.text || 'Anexo'}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="bg-[#25d366] text-white text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1.5 flex-shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Desktop View - Conversations List Only */}
      <div className="hidden md:flex h-[calc(100vh-8rem)] gap-4">
        <Card className="w-80 flex-shrink-0 flex flex-col overflow-hidden">
          <div className="p-4 border-b bg-[#075e54] text-white">
            <h2 className="font-semibold text-lg">Conversas</h2>
          </div>
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Pesquisar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-gray-100 border-0"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>Nenhuma conversa</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.userId}
                  onClick={() => setSelectedCustomerId(conv.userId)}
                  className="p-3 cursor-pointer transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      {getCustomerAvatar(conv.userId) ? (
                        <img 
                          src={getCustomerAvatar(conv.userId)!} 
                          alt="" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#075e54] to-[#128c7e] text-white font-bold text-lg">
                          {getCustomerName(conv.userId).charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold truncate">{getCustomerName(conv.userId)}</h3>
                        <span className="text-xs text-muted-foreground">
                          {new Date(conv.lastMessage.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-sm text-muted-foreground truncate">{conv.lastMessage.text}</p>
                        {conv.unreadCount > 0 && (
                          <span className="bg-[#25d366] text-white text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1.5">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="flex-1 flex items-center justify-center bg-[#f8f9fa]">
          <div className="text-center text-muted-foreground">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
              <Send className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium mb-2">Suas conversas</h3>
            <p className="text-sm">Selecione uma conversa para ver as mensagens</p>
          </div>
        </Card>
      </div>
    </>
  );
};

export default ChatFornecedor;