import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (location.state?.storeId) {
      setSelectedChat(location.state.storeId);
    }
  }, [location.state]);

  const conversations = [
    {
      id: 1,
      storeId: 1,
      name: "Suporte Nellor",
      lastMessage: "Como posso ajudar você hoje?",
      time: "10:30",
      unread: 2,
      avatar: "🎧",
    },
    {
      id: 2,
      storeId: 2,
      name: "Fornecedor Prime",
      lastMessage: "Seu pedido foi enviado!",
      time: "09:15",
      unread: 0,
      avatar: "🏪",
    },
    {
      id: 3,
      storeId: 3,
      name: "Fashion Store",
      lastMessage: "Temos novidades para você",
      time: "Ontem",
      unread: 1,
      avatar: "👕",
    },
  ];

  // Se veio do perfil da loja e não existe na lista, adiciona
  if (location.state?.storeId && !conversations.find(c => c.storeId === location.state.storeId)) {
    conversations.unshift({
      id: location.state.storeId,
      storeId: location.state.storeId,
      name: location.state.storeName || "Loja",
      lastMessage: "Iniciar conversa",
      time: "Agora",
      unread: 0,
      avatar: location.state.storeAvatar || "🏪",
    });
  }

  const messages = [
    { id: 1, text: "Olá! Como posso ajudar?", sender: "other", time: "10:25" },
    { id: 2, text: "Oi! Gostaria de saber sobre o prazo de entrega", sender: "me", time: "10:27" },
    { id: 3, text: "O prazo de entrega é de 5 a 7 dias úteis", sender: "other", time: "10:28" },
    { id: 4, text: "Você pode rastrear seu pedido pelo app", sender: "other", time: "10:28" },
    { id: 5, text: "Perfeito! Muito obrigado", sender: "me", time: "10:30" },
  ];

  const handleSend = () => {
    if (message.trim()) {
      setMessage("");
    }
  };

  if (selectedChat) {
    const chat = conversations.find(c => c.id === selectedChat);
    
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
        <main className="container mx-auto px-4 py-6 relative z-10 space-y-4" style={{ paddingBottom: "100px" }}>
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] ${msg.sender === "me" ? "bg-primary text-white" : "bg-white border shadow-sm"} rounded-2xl px-4 py-3`}>
                <p className="text-sm">{msg.text}</p>
                <p className="text-xs opacity-70 mt-1">{msg.time}</p>
              </div>
            </div>
          ))}
        </main>

        {/* Input de Mensagem */}
        <div className="fixed bottom-16 left-0 right-0 bg-white/95 backdrop-blur-lg border-t shadow-sm p-4 z-30">
          <div className="container mx-auto flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Digite sua mensagem..."
            />
            <Button
              onClick={handleSend}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <Send className="h-5 w-5" />
            </Button>
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
              onClick={() => setSelectedChat(conv.id)}
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