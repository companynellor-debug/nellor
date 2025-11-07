import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, User, Clock } from "lucide-react";

interface SupportMessage {
  id: string;
  userName: string;
  userType: 'cliente' | 'fornecedor';
  subject: string;
  message: string;
  date: string;
  status: 'pending' | 'answered';
}

const SuporteAdmin = () => {
  const messages: SupportMessage[] = [
    {
      id: "MSG001",
      userName: "João Silva",
      userType: "cliente",
      subject: "Problema com pagamento",
      message: "Não consigo finalizar o pagamento do meu pedido...",
      date: "15/01/2025 14:30",
      status: "pending"
    },
    {
      id: "MSG002",
      userName: "Loja Tech",
      userType: "fornecedor",
      subject: "Dúvida sobre taxa",
      message: "Gostaria de entender melhor sobre a taxa da plataforma...",
      date: "15/01/2025 10:15",
      status: "pending"
    },
    {
      id: "MSG003",
      userName: "Maria Santos",
      userType: "cliente",
      subject: "Produto não chegou",
      message: "Meu pedido está atrasado há 3 dias...",
      date: "14/01/2025 16:45",
      status: "answered"
    },
  ];

  const pendingCount = messages.filter(m => m.status === 'pending').length;

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

      {/* Lista de Mensagens */}
      <Card>
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Mensagens Recentes</h2>
        </div>
        <div className="divide-y">
          {messages.map((msg) => (
            <div key={msg.id} className="p-6 hover:bg-muted/20 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{msg.userName}</p>
                      <p className="text-xs text-muted-foreground">
                        {msg.userType === 'cliente' ? 'Cliente' : 'Fornecedor'} • {msg.date}
                      </p>
                    </div>
                  </div>
                  <div className="mb-2">
                    <p className="font-medium mb-1">{msg.subject}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{msg.message}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={msg.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                    {msg.status === 'pending' ? 'Pendente' : 'Respondido'}
                  </Badge>
                  {msg.status === 'pending' && (
                    <Button size="sm">
                      Responder
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default SuporteAdmin;
