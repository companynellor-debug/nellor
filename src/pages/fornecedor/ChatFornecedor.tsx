import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Send, Paperclip, X, Download, Image as ImageIcon, Video, FileText } from "lucide-react";
import { MessageAttachment } from "@/hooks/useMessages";
import { useSupabaseMessages } from "@/hooks/useSupabaseMessages";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTypingPresence } from "@/hooks/useTypingPresence";

const ChatFornecedor = () => {
  const { user } = useSupabaseAuth();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [viewingImage, setViewingImage] = useState<{ url: string; name: string } | null>(null);
  const [customerProfiles, setCustomerProfiles] = useState<Map<string, any>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { 
    sendMessage: sendSupabaseMessage, 
    getConversations, 
    getMessagesByUser,
    getUnreadCount 
  } = useSupabaseMessages(user?.id);

  // Typing presence - only active when a customer is selected
  const chatId = selectedCustomerId && user?.id ? [user.id, selectedCustomerId].sort().join('_') : '';
  const { isOtherUserTyping, startTyping, stopTyping } = useTypingPresence(chatId, user?.id);

  const conversations = getConversations();
  const messages = selectedCustomerId ? getMessagesByUser(selectedCustomerId) : [];

  useEffect(() => {
    if (conversations.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(conversations[0].userId);
    }
  }, [conversations, selectedCustomerId]);

  useEffect(() => {
    // Fetch customer profiles
    const fetchProfiles = async () => {
      const userIds = conversations.map(c => c.userId);
      if (userIds.length === 0) return;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (data) {
        const profilesMap = new Map(data.map(p => [p.id, p]));
        setCustomerProfiles(profilesMap);
      }
    };

    fetchProfiles();
  }, [conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const selectedCustomer = selectedCustomerId ? customerProfiles.get(selectedCustomerId) : null;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-4">
      {/* Lista de Conversas */}
      <Card className="lg:w-80 flex-shrink-0 overflow-y-auto">
        <div className="p-4 border-b bg-white sticky top-0">
          <h2 className="font-semibold text-lg">Conversas</h2>
        </div>
        <div className="divide-y">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>Nenhuma conversa ainda</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const customer = customerProfiles.get(conv.userId);
              if (!customer) return null;

              return (
                <div
                  key={conv.userId}
                  onClick={() => setSelectedCustomerId(conv.userId)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedCustomerId === conv.userId
                      ? 'bg-primary/5 border-l-4 border-primary'
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {customer.nome?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold truncate">{customer.nome}</h3>
                        {conv.unreadCount > 0 && (
                          <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1.5">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage.text}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(conv.lastMessage.created_at).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Área de Chat */}
      <Card className="flex-1 flex flex-col min-h-0">
        {selectedCustomerId && selectedCustomer ? (
          <>
            {/* Header do Chat */}
            <div className="border-b p-4 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  {selectedCustomer.nome?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-semibold">{selectedCustomer.nome}</p>
                  {isOtherUserTyping ? (
                    <p className="text-sm text-primary animate-pulse">Digitando...</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
              {messages.map((msg, idx) => {
                const isFromMe = msg.from_user === user?.id;
                return (
                  <div
                    key={idx}
                    className={`flex ${isFromMe ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[70%] ${isFromMe ? 'items-start' : 'items-end'} flex flex-col gap-1`}>
                      {msg.text && (
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            isFromMe
                              ? 'bg-white rounded-bl-none shadow-sm'
                              : 'bg-primary text-primary-foreground rounded-br-none'
                          }`}
                        >
                          <p className="break-words">{msg.text}</p>
                        </div>
                      )}
                      
                      {msg.attachments && msg.attachments.map((attachmentUrl, attIdx) => {
                        const isImage = attachmentUrl.startsWith('data:image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(attachmentUrl);
                        const isVideo = attachmentUrl.startsWith('data:video') || /\.(mp4|webm|ogg)$/i.test(attachmentUrl);
                        
                        return (
                          <div key={attIdx} className={`rounded-2xl overflow-hidden ${isFromMe ? 'bg-white shadow-sm' : 'bg-primary/10'}`}>
                            {isImage && (
                              <img 
                                src={attachmentUrl} 
                                alt="Anexo"
                                className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
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
                                className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
                              >
                                <FileText className="h-8 w-8 text-primary" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">Arquivo anexo</p>
                                  <p className="text-xs text-muted-foreground">Clique para baixar</p>
                                </div>
                              </a>
                            )}
                          </div>
                        );
                      })}
                      
                      <span className="text-xs text-muted-foreground px-2">
                        {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Preview de Anexos */}
            {attachments.length > 0 && (
              <div className="border-t p-3 bg-white">
                <div className="flex gap-2 overflow-x-auto">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="relative flex-shrink-0">
                      {att.type === 'image' ? (
                        <img src={att.url} alt={att.name} className="h-20 w-20 object-cover rounded-lg" />
                      ) : (
                        <div className="h-20 w-20 bg-muted rounded-lg flex items-center justify-center">
                          {att.type === 'video' ? <Video className="h-8 w-8" /> : <FileText className="h-8 w-8" />}
                        </div>
                      )}
                      <button
                        onClick={() => removeAttachment(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input de Mensagem */}
            <div className="border-t p-4 bg-white">
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx"
                />
                <Button 
                  size="icon" 
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  placeholder="Digite sua mensagem..."
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
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={!message.trim() && attachments.length === 0}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Selecione uma conversa para começar
          </div>
        )}
      </Card>

      {/* Modal de Visualização de Imagem */}
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
                  <Button
                    onClick={handleDownloadImage}
                    className="bg-primary hover:bg-primary/90 gap-2"
                  >
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
                <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
                  {viewingImage.name}
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatFornecedor;
