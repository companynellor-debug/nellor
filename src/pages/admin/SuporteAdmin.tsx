import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, User, Clock, ArrowLeft, Send } from "lucide-react";
import { useSupportMessages } from "@/hooks/useSupportMessages";
import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

const SuporteAdmin = () => {
  const { getConversations, getMessagesByUser, sendMessage, markAsRead, messages } = useSupportMessages();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const conversations = getConversations();
  const pendingCount = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
  
  const selectedConversation = conversations.find(c => c.userId === selectedUserId);
  const chatMessages = selectedUserId ? getMessagesByUser(selectedUserId) : [];

  useEffect(() => {
    if (selectedUserId) {
      markAsRead(selectedUserId);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedUserId, chatMessages.length]);

  const handleSendMessage = () => {
    if (!message.trim() || !selectedUserId || !selectedConversation) return;
    
    sendMessage(
      selectedUserId,
      selectedConversation.userName,
      selectedConversation.userType,
      message,
      'admin'
    );
    setMessage("");
  };

  if (selectedUserId && selectedConversation) {
    return (
      <div className="flex flex-col h-[calc(100vh-120px)]">
        <div className="border-b bg-white p-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedUserId(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">{selectedConversation.userName}</h2>
            <p className="text-sm text-muted-foreground">
              {selectedConversation.userType === 'cliente' ? 'Cliente' : 'Fornecedor'}
            </p>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.sender === 'admin'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                  <p className={`text-xs mt-1 ${
                    msg.sender === 'admin' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t bg-white p-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Digite sua resposta..."
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
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 dark:text-white dark:bg-none">Suporte</h1>
        <p className="text-muted-foreground">Mensagens de clientes e fornecedores</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Mensagens Pendentes</p>
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold">{pendingCount}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total de Mensagens</p>
            <MessageCircle className="h-5 w-5 text-primary" />
          </div>
          <p className="text-3xl font-bold">{messages.length}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Taxa de Resposta</p>
            <User className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold">92%</p>
        </Card>
      </div>

      {/* Lista de Conversas */}
      <Card>
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Conversas Recentes</h2>
        </div>
        <div className="divide-y">
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nenhuma conversa ainda</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.userId}
                className="p-6 hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => setSelectedUserId(conv.userId)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{conv.userName}</p>
                          {conv.unreadCount > 0 && (
                            <Badge variant="destructive" className="h-5 min-w-5 flex items-center justify-center px-1.5">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {conv.userType === 'cliente' ? 'Cliente' : 'Fornecedor'} • {conv.lastMessage.timestamp}
                        </p>
                      </div>
                    </div>
                    <div className="mb-2">
                      <p className="text-sm text-muted-foreground line-clamp-2">{conv.lastMessage.text}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default SuporteAdmin;
