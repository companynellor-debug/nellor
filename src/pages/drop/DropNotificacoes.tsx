import { 
  Bell, 
  CheckCircle, 
  Package, 
  DollarSign,
  AlertCircle,
  Info,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Placeholder notifications based on drop activity
const mockNotifications = [
  {
    id: '1',
    type: 'order',
    title: 'Novo pedido recebido',
    message: 'Pedido #ND-001234 foi criado automaticamente',
    time: '2 min atrás',
    read: false
  },
  {
    id: '2',
    type: 'payment',
    title: 'Pagamento confirmado',
    message: 'O pagamento do pedido #ND-001233 foi aprovado',
    time: '15 min atrás',
    read: false
  },
  {
    id: '3',
    type: 'shipped',
    title: 'Produto enviado',
    message: 'O fornecedor despachou o pedido #ND-001232',
    time: '1 hora atrás',
    read: true
  },
  {
    id: '4',
    type: 'alert',
    title: 'Estoque baixo',
    message: 'O produto "Fone Bluetooth XYZ" está com estoque baixo',
    time: '3 horas atrás',
    read: true
  },
];

const DropNotificacoes = () => {
  const getNotificationConfig = (type: string) => {
    switch (type) {
      case 'order':
        return { icon: Package, color: 'text-drop-accent bg-drop-accent/10' };
      case 'payment':
        return { icon: DollarSign, color: 'text-drop-success bg-drop-success/10' };
      case 'shipped':
        return { icon: CheckCircle, color: 'text-drop-accent bg-drop-accent/10' };
      case 'alert':
        return { icon: AlertCircle, color: 'text-drop-warning bg-drop-warning/10' };
      default:
        return { icon: Info, color: 'text-drop-text-muted bg-drop-surface' };
    }
  };

  const unreadCount = mockNotifications.filter(n => !n.read).length;

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold text-drop-text">Notificações</h1>
            {unreadCount > 0 && (
              <Badge className="bg-drop-accent text-white">
                {unreadCount} novas
              </Badge>
            )}
          </div>
          <p className="text-drop-text-muted mt-1">Alertas e atualizações do seu negócio</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            className="border-drop-border text-drop-text hover:bg-drop-surface-hover"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Marcar todas como lidas
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-drop-card border border-drop-border rounded-2xl overflow-hidden">
        {mockNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="h-16 w-16 text-drop-text-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-drop-text mb-2">Nenhuma notificação</h3>
            <p className="text-drop-text-muted">
              Você será notificado sobre novos pedidos, pagamentos e atualizações
            </p>
          </div>
        ) : (
          <div className="divide-y divide-drop-border">
            {mockNotifications.map((notification) => {
              const config = getNotificationConfig(notification.type);
              return (
                <div 
                  key={notification.id}
                  className={cn(
                    "p-4 lg:p-5 transition-colors cursor-pointer",
                    notification.read 
                      ? "hover:bg-drop-surface-hover" 
                      : "bg-drop-accent/5 hover:bg-drop-accent/10"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn("p-2.5 rounded-xl flex-shrink-0", config.color)}>
                      <config.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className={cn(
                            "font-medium",
                            notification.read ? "text-drop-text" : "text-drop-text"
                          )}>
                            {notification.title}
                          </p>
                          <p className="text-drop-text-muted text-sm mt-0.5">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="h-2.5 w-2.5 rounded-full bg-drop-accent flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-drop-text-muted text-xs mt-2">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notification Settings Link */}
      <div className="bg-drop-surface border border-drop-border rounded-2xl p-4 lg:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-drop-text-muted" />
            <div>
              <p className="text-drop-text font-medium">Preferências de notificação</p>
              <p className="text-drop-text-muted text-sm">Configure quais alertas deseja receber</p>
            </div>
          </div>
          <Button 
            variant="outline"
            className="border-drop-border text-drop-text hover:bg-drop-surface-hover"
          >
            Configurar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DropNotificacoes;
