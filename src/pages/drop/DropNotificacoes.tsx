import {
  Bell,
  CheckCircle,
  Package,
  DollarSign,
  AlertCircle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Placeholder notifications based on drop activity
const mockNotifications = [
  {
    id: "1",
    type: "order",
    title: "Novo pedido recebido",
    message: "Pedido #ND-001234 foi criado automaticamente",
    time: "2 min atrás",
    read: false,
  },
  {
    id: "2",
    type: "payment",
    title: "Pagamento confirmado",
    message: "O pagamento do pedido #ND-001233 foi aprovado",
    time: "15 min atrás",
    read: false,
  },
  {
    id: "3",
    type: "shipped",
    title: "Produto enviado",
    message: "O fornecedor despachou o pedido #ND-001232",
    time: "1 hora atrás",
    read: true,
  },
  {
    id: "4",
    type: "alert",
    title: "Estoque baixo",
    message: 'O produto "Fone Bluetooth XYZ" está com estoque baixo',
    time: "3 horas atrás",
    read: true,
  },
];

const DropNotificacoes = () => {
  const getNotificationConfig = (type: string) => {
    switch (type) {
      case "order":
        return { icon: Package, className: "text-primary bg-primary/10" };
      case "payment":
        return { icon: DollarSign, className: "text-green-600 bg-green-500/10" };
      case "shipped":
        return { icon: CheckCircle, className: "text-primary bg-primary/10" };
      case "alert":
        return {
          icon: AlertCircle,
          className: "text-amber-600 bg-amber-500/10",
        };
      default:
        return { icon: Info, className: "text-muted-foreground bg-muted" };
    }
  };

  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">Notificações</h1>
            {unreadCount > 0 && (
              <Badge className="bg-primary text-primary-foreground">
                {unreadCount} novas
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            Alertas e atualizações do seu negócio
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <CheckCircle className="h-4 w-4 mr-2" />
            Marcar todas como lidas
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <Card className="bg-card border-border overflow-hidden">
        <CardContent className="p-0">
          {mockNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Nenhuma notificação
              </h3>
              <p className="text-muted-foreground">
                Você será notificado sobre novos pedidos, pagamentos e atualizações
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {mockNotifications.map((notification) => {
                const config = getNotificationConfig(notification.type);

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 lg:p-5 transition-colors cursor-pointer",
                      notification.read
                        ? "hover:bg-muted/50"
                        : "bg-primary/5 hover:bg-primary/10"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "p-2.5 rounded-xl flex-shrink-0",
                          config.className
                        )}
                      >
                        <config.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-foreground">
                              {notification.title}
                            </p>
                            <p className="text-muted-foreground text-sm mt-0.5">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="h-2.5 w-2.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-muted-foreground text-xs mt-2">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings Link */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 lg:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-foreground font-medium">
                  Preferências de notificação
                </p>
                <p className="text-muted-foreground text-sm">
                  Configure quais alertas deseja receber
                </p>
              </div>
            </div>
            <Button variant="outline">Configurar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DropNotificacoes;
