import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MessageCircle, ArrowLeft, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ConversationItem {
  chat_id: string;
  user1_id: string;
  user2_id: string;
  user1_name: string;
  user2_name: string;
  last_message: string;
  last_message_at: string;
  message_count: number;
}

interface ChatMessage {
  id: string;
  from_user: string;
  to_user: string;
  text: string;
  created_at: string;
  from_name: string;
  to_name: string;
}

const Conversas = () => {
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_admin_conversations', {
        _search: search || null,
      });
      if (error) throw error;
      setConversations((data || []) as any as ConversationItem[]);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_admin_chat_messages', {
        _chat_id: chatId,
      });
      if (error) throw error;
      setMessages((data || []) as any as ChatMessage[]);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleSearch = () => fetchConversations();

  if (selectedChat) {
    const conv = conversations.find(c => c.chat_id === selectedChat);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedChat(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="font-bold text-lg">
              {conv?.user1_name} ↔ {conv?.user2_name}
            </h2>
            <p className="text-xs text-muted-foreground">{messages.length} mensagens</p>
          </div>
          <Badge variant="outline" className="ml-auto">
            <Shield className="h-3 w-3 mr-1" />
            Auditoria
          </Badge>
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-3 p-3 bg-card rounded-lg border">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold">{msg.from_name}</span>
                  <span className="text-[10px] text-muted-foreground">→ {msg.to_name}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {new Date(msg.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Conversas</h1>
        <p className="text-sm text-muted-foreground">Auditoria de mensagens entre compradores e fornecedores</p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Buscar por nome ou palavra-chave..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={loading} className="gap-1">
          <Search className="h-4 w-4" />
          Buscar
        </Button>
      </div>

      <div className="space-y-2">
        {conversations.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Nenhuma conversa encontrada</p>
          </Card>
        ) : (
          conversations.map((conv) => (
            <Card
              key={conv.chat_id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedChat(conv.chat_id);
                fetchMessages(conv.chat_id);
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm truncate">
                      {conv.user1_name} ↔ {conv.user2_name}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(conv.last_message_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
                  <Badge variant="secondary" className="text-[10px] mt-1">
                    {conv.message_count} msgs
                  </Badge>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Conversas;
