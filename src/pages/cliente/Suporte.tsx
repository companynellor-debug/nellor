import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, MessageCircle, Image as ImageIcon, Paperclip } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useSupportMessages } from "@/hooks/useSupportMessages";
import { ScrollArea } from "@/components/ui/scroll-area";

const Suporte = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const { sendMessage, getMessagesByUser, markAsRead } = useSupportMessages();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const userId = "user_1"; // Em produção, pegar do contexto de autenticação
  const userName = "João Silva"; // Em produção, pegar do contexto de autenticação
  
  const chatMessages = getMessagesByUser(userId);

  useEffect(() => {
    markAsRead(userId);
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages.length]);

  const handleSendMessage = () => {
    if (!message.trim()) {
      toast.error("Digite uma mensagem");
      return;
    }
    
    sendMessage(userId, userName, 'cliente', message, 'user');
    setMessage("");
    
    // Simular resposta automática do admin após 2 segundos
    setTimeout(() => {
      sendMessage(userId, userName, 'cliente', "Obrigado por entrar em contato! Nossa equipe irá analisar sua mensagem e responder em breve.", 'admin');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col">
      <ParticlesBackground />

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate("/cliente/perfil")} className="hover:bg-accent p-2 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary">Suporte Nellor</h1>
              <p className="text-xs text-muted-foreground">Atendimento ao cliente</p>
            </div>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1 relative z-10">
        <div className="container mx-auto px-4 py-4 max-w-2xl space-y-3">
          {chatMessages.length === 0 ? (
            <Card className="bg-white border shadow-sm p-6 text-center">
              <MessageCircle className="h-16 w-16 mx-auto text-primary mb-4" />
              <h2 className="text-xl font-bold mb-2">Como podemos ajudar?</h2>
              <p className="text-sm text-muted-foreground">
                Nossa equipe está pronta para resolver suas dúvidas
              </p>
            </Card>
          ) : (
            chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                  <p className={`text-xs mt-1 ${
                    msg.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="sticky bottom-0 z-40 bg-white border-t p-4 mb-16">
        <div className="container mx-auto max-w-2xl">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Suporte;
