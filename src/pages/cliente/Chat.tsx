import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, ArrowLeft, Paperclip, X, Image as ImageIcon, Video, FileText } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMessages, MessageAttachment } from "@/hooks/useMessages";
import { toast } from "@/hooks/use-toast";

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { sendMessage, getMessagesByStore, markAsRead } = useMessages();
  
  const [conversations, setConversations] = useState([
    {
      id: 1,
      storeId: 1,
      name: "Nike Store Oficial",
      lastMessage: "Olá! Como posso ajudar você hoje?",
      time: "10:30",
      unread: 0,
      avatar: "👟",
    },
    {
      id: 2,
      storeId: 2,
      name: "Fashion Bags Premium",
      lastMessage: "Temos novos modelos disponíveis!",
      time: "09:15",
      unread: 0,
      avatar: "👜",
    },
    {
      id: 3,
      storeId: 3,
      name: "Tech Store Brasil",
      lastMessage: "Confira nossas ofertas de tecnologia",
      time: "Ontem",
      unread: 0,
      avatar: "📱",
    },
    {
      id: 4,
      storeId: 4,
      name: "Audio Pro Shop",
      lastMessage: "Novidades em equipamentos de áudio!",
      time: "Ontem",
      unread: 0,
      avatar: "🎧",
    },
  ]);

  useEffect(() => {
    if (location.state?.storeId) {
      const conversationExists = conversations.find(c => c.storeId === location.state.storeId);
      
      if (!conversationExists) {
        const newConversation = {
          id: location.state.storeId,
          storeId: location.state.storeId,
          name: location.state.storeName || "Loja",
          lastMessage: location.state.message || "Iniciar conversa",
          time: "Agora",
          unread: 0,
          avatar: location.state.storeAvatar || "🏪",
        };
        setConversations(prev => [newConversation, ...prev]);
      }
      
      setSelectedChat(location.state.storeId);
      markAsRead(location.state.storeId);
      
      // Se veio do checkout com mensagem, envia automaticamente
      if (location.state.message) {
        setTimeout(() => {
          sendMessage(location.state.storeId, location.state.message);
        }, 500);
      }
    }
  }, [location.state]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedChat]);

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
    if (!selectedChat) return;
    
    if (!message.trim() && attachments.length === 0) {
      toast({
        title: "Mensagem vazia",
        description: "Digite uma mensagem ou anexe um arquivo",
        variant: "destructive"
      });
      return;
    }

    sendMessage(selectedChat, message.trim(), attachments.length > 0 ? attachments : undefined);
    setMessage("");
    setAttachments([]);
    
    toast({
      title: "Mensagem enviada",
      description: "Sua mensagem foi enviada com sucesso"
    });
  };

  const currentMessages = selectedChat ? getMessagesByStore(selectedChat) : [];

  if (selectedChat) {
    const chat = conversations.find(c => c.storeId === selectedChat);
    
    return (
      <div className="min-h-screen bg-background pb-20">
        <ParticlesBackground />

        {/* Header do Chat */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center gap-3">
            <button onClick={() => setSelectedChat(null)} className="p-2 hover:bg-muted rounded-full transition-colors">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div 
              onClick={() => chat?.storeId && navigate(`/cliente/loja/${chat.storeId}`)}
              className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="text-3xl">{chat?.avatar}</div>
              <div>
                <h2 className="font-bold">{chat?.name}</h2>
                <p className="text-xs text-muted-foreground">Online</p>
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
            currentMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] ${
                  msg.sender === "user" 
                    ? "bg-primary text-white" 
                    : "bg-white border shadow-sm"
                } rounded-2xl px-4 py-3`}>
                  {msg.text && <p className="text-sm break-words whitespace-pre-wrap">{msg.text}</p>}
                  
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {msg.attachments.map((attachment, idx) => (
                        <div key={idx} className="rounded-lg overflow-hidden">
                          {attachment.type === 'image' && (
                            <img 
                              src={attachment.url} 
                              alt={attachment.name}
                              className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90"
                              onClick={() => window.open(attachment.url, '_blank')}
                            />
                          )}
                          {attachment.type === 'video' && (
                            <video 
                              src={attachment.url} 
                              controls 
                              className="max-w-full h-auto rounded-lg"
                            />
                          )}
                          {attachment.type === 'file' && (
                            <a 
                              href={attachment.url} 
                              download={attachment.name}
                              className="flex items-center gap-2 p-2 bg-accent rounded-lg hover:bg-accent/80"
                            >
                              <FileText className="h-4 w-4" />
                              <span className="text-xs truncate">{attachment.name}</span>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs opacity-70 mt-1">{msg.timestamp}</p>
                </div>
              </div>
            ))
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
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
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
          {conversations.map((conv) => (
            <Card
              key={conv.id}
              onClick={() => setSelectedChat(conv.storeId)}
              className="bg-white border shadow-sm p-4 cursor-pointer hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl flex-shrink-0">
                  {conv.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold truncate">{conv.name}</h3>
                    <span className="text-xs text-muted-foreground">{conv.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                    {conv.unread > 0 && (
                      <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-2">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Chat;