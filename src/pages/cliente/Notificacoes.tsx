import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, Bell, Tag, Truck, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSupabaseNotifications } from "@/hooks/useSupabaseNotifications";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const Notificacoes = () => {
  const navigate = useNavigate();
  const { notifications, markAsRead } = useSupabaseNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_update':
        return { icon: Package, color: "text-blue-600", bgColor: "bg-blue-100" };
      case 'message':
        return { icon: Bell, color: "text-purple-600", bgColor: "bg-purple-100" };
      case 'payout':
        return { icon: Tag, color: "text-green-600", bgColor: "bg-green-100" };
      case 'alert':
        return { icon: AlertCircle, color: "text-orange-600", bgColor: "bg-orange-100" };
      default:
        return { icon: Bell, color: "text-gray-600", bgColor: "bg-gray-100" };
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <ParticlesBackground />

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate("/cliente/perfil")} className="hover:bg-accent p-2 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-primary">Notificações</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        <div className="space-y-3">
          {notifications.map((notification) => {
            const iconInfo = getNotificationIcon(notification.type);
            const Icon = iconInfo.icon;
            return (
              <Card
                key={notification.id}
                className={`bg-white border shadow-sm p-4 hover:shadow-md transition-all cursor-pointer ${
                  !notification.read ? 'border-primary/30' : ''
                }`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-full ${iconInfo.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-6 w-6 ${iconInfo.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-sm">{notification.title}</h3>
                      {!notification.read && (
                        <Badge variant="default" className="bg-primary text-white text-xs px-2 py-0">
                          Nova
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{notification.body}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), { locale: ptBR, addSuffix: true })}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {notifications.length === 0 && (
          <Card className="bg-white border shadow-sm p-8 text-center">
            <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-bold text-lg mb-2">Nenhuma notificação</h3>
            <p className="text-sm text-muted-foreground">
              Você está em dia! Não há notificações no momento.
            </p>
          </Card>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Notificacoes;
