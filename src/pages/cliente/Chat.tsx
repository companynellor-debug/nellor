import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Send, ArrowLeft, Paperclip, X, Video, FileText, Download, Handshake } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { NegotiationForm } from "@/components/chat/NegotiationForm";
import { useLocation, useNavigate } from "react-router-dom";
import { MessageAttachment } from "@/hooks/useMessages";
import { useSupabaseMessages } from "@/hooks/useSupabaseMessages";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "@/hooks/use-toast";
import { useSupabaseStores } from "@/hooks/useSupabaseStores";
import { useTypingPresence } from "@/hooks/useTypingPresence";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    sendMessage: sendSupabaseMessage, 
    getConversations, 
    getMessagesByUser, 
    markAsRead,
    getUnreadCount 
  } = useSupabaseMessages();

  // Typing presence - only active when a supplier is selected
  const chatId = selectedUserId && user?.id ? [user.id, selectedUserId].sort().join('_') : '';
  const { isOtherUserTyping, startTyping, stopTyping } = useTypingPresence(chatId, user?.id);

  const handleDownloadImage = () => {
    if (!viewingImage) return;
    
    const link = document.createElement('a');
    link.href = viewingImage.url;
    link.download = viewingImage.name || 'imagem.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download iniciado",
      description: "A imagem está sendo baixada"
    });
  };
  
  const conversations = getConversations();

  useEffect(() => {
    if (location.state?.supplierId) {
      const supplierId = location.state.supplierId;
      const message = location.state.message;
      
      setSelectedUserId(supplierId);
      markAsRead(supplierId);
      
      // Se veio com mensagem, envia automaticamente
      if (message && user) {
        setTimeout(async () => {
          try {
            await sendSupabaseMessage(supplierId, message);
            toast({
              title: "Mensagem enviada",
              description: "Sua mensagem foi enviada com sucesso"
            });
            // Limpa o state para não reenviar
            navigate('/cliente/chat', { 
              state: { supplierId },
              replace: true 
            });
          } catch (error) {
            console.error('Erro ao enviar mensagem automática:', error);
            toast({
              title: "Erro ao enviar mensagem",
              description: "Tente novamente",
              variant: "destructive"
            });
          }
        }, 1000);
      }
    }
  }, [location.state, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedUserId, conversations]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const newAttachments: MessageAttachment[] = [];

    // Processa todos os arquivos
    for (const file of fileArray) {
      const fileType = file.type.startsWith('image/') ? 'image' 
        : file.type.startsWith('video/') ? 'video' 
        : 'file';

      // Validação de tamanho (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: `${file.name} excede 10MB`,
          variant: "destructive"
        });
        continue;
      }

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        newAttachments.push({
          type: fileType,
          url: base64,
          name: file.name
        });
      } catch (error) {
        console.error('Erro ao ler arquivo:', error);
        toast({
          title: "Erro ao processar arquivo",
          description: `Não foi possível processar ${file.name}`,
          variant: "destructive"
        });
      }
    }

    if (newAttachments.length > 0) {
      setAttachments(prev => [...prev, ...newAttachments]);
      toast({
        title: "Arquivos anexados",
        description: `${newAttachments.length} arquivo(s) anexado(s) com sucesso`
      });
    }

    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (!selectedUserId) return;
    
    if (!message.trim() && attachments.length === 0) {
      toast({
        title: "Mensagem vazia",
        description: "Digite uma mensagem ou anexe um arquivo",
        variant: "destructive"
      });
      return;
    }

    stopTyping();
    sendSupabaseMessage(selectedUserId, message.trim(), attachments.length > 0 ? attachments : undefined);
    setMessage("");
    setAttachments([]);
  };

  const currentMessages = selectedUserId ? getMessagesByUser(selectedUserId) : [];
  const selectedSupplier = selectedUserId ? stores.find(s => s.id === selectedUserId) : null;

  if (selectedUserId && selectedSupplier) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <ParticlesBackground />

        {/* Header do Chat */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center gap-3">
            <button onClick={() => setSelectedUserId(null)} className="p-2 hover:bg-muted rounded-full transition-colors">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div 
              onClick={() => navigate(`/cliente/loja/${selectedSupplier.id}`)}
              className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <img src={selectedSupplier.foto_perfil_url || '/placeholder.svg'} alt={selectedSupplier.nome} className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="font-bold">{selectedSupplier.nome}</h2>
                {isOtherUserTyping ? (
                  <p className="text-xs text-primary animate-pulse">Digitando...</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Online</p>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Mensagens */}
        <main className="container mx-auto px-4 py-6 relative z-10 space-y-4" style={{ paddingBottom: "120px" }}>
          {currentMessages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhuma mensagem ainda</p>
              <p className="text-sm text-muted-foreground mt-2">Envie uma mensagem para começar a conversa</p>
            </div>
          ) : (
            currentMessages.map((msg) => {
              const isFromMe = msg.from_user === user?.id;
              return (
                <div key={msg.id} className={`flex ${isFromMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] ${
                    isFromMe
                      ? "bg-primary text-white" 
                      : "bg-white border shadow-sm"
                  } rounded-2xl px-4 py-3`}>
                    {msg.text && <p className="text-sm break-words whitespace-pre-wrap">{msg.text}</p>}
                    
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {msg.attachments.map((attachmentUrl, idx) => {
                          const isImage = attachmentUrl.startsWith('data:image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(attachmentUrl);
                          const isVideo = attachmentUrl.startsWith('data:video') || /\.(mp4|webm|ogg)$/i.test(attachmentUrl);
                          
                          return (
                            <div key={idx} className="rounded-lg overflow-hidden">
                              {isImage && (
                                <img 
                                  src={attachmentUrl} 
                                  alt="Anexo"
                                  className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => setViewingImage({ url: attachmentUrl, name: `anexo-${idx}` })}
                                />
                              )}
                              {isVideo && (
                                <video 
                                  src={attachmentUrl} 
                                  controls 
                                  className="max-w-full h-auto rounded-lg"
                                />
                              )}
                              {!isImage && !isVideo && (
                                <a 
                                  href={attachmentUrl} 
                                  download={`arquivo-${idx}`}
                                  className="flex items-center gap-2 p-2 bg-accent rounded-lg hover:bg-accent/80"
                                >
                                  <FileText className="h-4 w-4" />
                                  <span className="text-xs truncate">Arquivo anexo</span>
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Input de Mensagem */}
        <div className="fixed bottom-16 left-0 right-0 bg-white/95 backdrop-blur-lg border-t shadow-sm p-4 z-30">
          <div className="container mx-auto">
            {/* Preview de Anexos */}
            {attachments.length > 0 && (
              <div className="mb-3 flex gap-2 overflow-x-auto pb-2">
                {attachments.map((attachment, idx) => (
                  <div key={idx} className="relative flex-shrink-0">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-accent flex items-center justify-center">
                      {attachment.type === 'image' && (
                        <img src={attachment.url} alt="" className="w-full h-full object-cover" />
                      )}
                      {attachment.type === 'video' && (
                        <Video className="h-8 w-8 text-muted-foreground" />
                      )}
                      {attachment.type === 'file' && (
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <button
                      onClick={() => removeAttachment(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Input */}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,.pdf,.doc,.docx"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0"
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <Input
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  startTyping();
                }}
                onBlur={stopTyping}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    stopTyping();
                    handleSend();
                  }
                }}
                placeholder="Digite sua mensagem..."
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                className="bg-primary hover:bg-primary/90 text-white flex-shrink-0"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

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

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <ParticlesBackground />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-primary">Conversas</h1>
          <p className="text-sm text-muted-foreground">{conversations.length} conversas ativas</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        <div className="space-y-3">
          {conversations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhuma conversa ainda</p>
              <p className="text-sm text-muted-foreground mt-2">Converse com lojas através dos produtos</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const supplier = stores.find(s => s.id === conv.userId);
              if (!supplier) return null;
              
              return (
                <Card
                  key={conv.userId}
                  onClick={() => {
                    setSelectedUserId(conv.userId);
                    markAsRead(conv.userId);
                  }}
                  className="bg-white border shadow-sm p-4 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
                      <img src={supplier.foto_perfil_url || '/placeholder.svg'} alt={supplier.nome} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold truncate">{supplier.nome}</h3>
                        <span className="text-xs text-muted-foreground">
                          {new Date(conv.lastMessage.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">{conv.lastMessage.text}</p>
                        {conv.unreadCount > 0 && (
                          <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-2">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Chat;