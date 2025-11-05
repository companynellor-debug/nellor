import { Card } from "@/components/ui/card";
import { Package, MessageSquare, XCircle, CheckCircle, Bell } from "lucide-react";

const Notificacoes = () => {
  const notifications = [
    {
      id: 1,
      type: 'new_order',
      title: 'Novo pedido recebido',
      message: 'Pedido #1452 aguardando confirmação',
      time: 'há 2 horas',
      icon: Package,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      id: 2,
      type: 'payment_proof',
      title: 'Comprovante enviado',
      message: 'Cliente enviou comprovante no pedido #1452',
      time: 'há 4 horas',
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      id: 3,
      type: 'new_message',
      title: 'Nova mensagem no chat',
      message: 'João M. enviou uma mensagem',
      time: 'há 6 horas',
      icon: MessageSquare,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      id: 4,
      type: 'order_cancelled',
      title: 'Pedido cancelado',
      message: 'Pedido #1450 foi cancelado pelo cliente',
      time: 'há 1 dia',
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      id: 5,
      type: 'order_delivered',
      title: 'Pedido entregue',
      message: 'Pedido #1448 foi entregue com sucesso',
      time: 'há 2 dias',
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Notificações</h1>
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => {
          const Icon = notification.icon;
          return (
            <Card key={notification.id} className={`p-4 ${notification.bg} border-none`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full bg-white`}>
                  <Icon className={`h-6 w-6 ${notification.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{notification.title}</h3>
                  <p className="text-muted-foreground">{notification.message}</p>
                  <p className="text-sm text-muted-foreground mt-1">{notification.time}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Notificacoes;
