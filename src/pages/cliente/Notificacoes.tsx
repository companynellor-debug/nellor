import { ParticlesBackground } from "@/components/cliente/ParticlesBackground";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, Bell, Tag, Truck, AlertCircle, BellRing, CheckCircle2, X, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSupabaseNotifications } from "@/hooks/useSupabaseNotifications";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

const Notificacoes = () => {
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead, unreadCount, pushPermission, requestPushPermission } = useSupabaseNotifications();
  const [showPermissionBanner, setShowPermissionBanner] = useState(true);

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

  const handleEnableNotifications = async () => {
    const granted = await requestPushPermission();
    if (granted) {
      setShowPermissionBanner(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <ParticlesBackground />

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/cliente/perfil")} className="hover:bg-accent p-2 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-primary">Notificações</h1>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Marcar todas
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/cliente/configuracoes-notificacoes")}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        {/* Push Notification Permission Banner */}
        {showPermissionBanner && pushPermission !== 'granted' && pushPermission !== 'denied' && (
          <Card className="bg-gradient-to-r from-primary/10 to-purple-100 border-primary/20 p-4 mb-6 relative">
            <button 
              onClick={() => setShowPermissionBanner(false)}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <BellRing className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm mb-1">Ativar notificações</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Receba alertas instantâneos sobre seus pedidos, mesmo quando não estiver no site.
                </p>
                <Button size="sm" onClick={handleEnableNotifications}>
                  Ativar notificações
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Permission Granted Badge */}
        {pushPermission === 'granted' && (
          <div className="flex items-center gap-2 mb-4 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm">Notificações push ativadas</span>
          </div>
        )}

        <div className="space-y-3">
          {notifications.map((notification) => {
            const iconInfo = getNotificationIcon(notification.type);
            const Icon = iconInfo.icon;
            return (
              <Card
                key={notification.id}
                className={`bg-white border shadow-sm p-4 hover:shadow-md transition-all cursor-pointer ${
                  !notification.read ? 'border-primary/30 bg-primary/5' : ''
                }`}
                onClick={() => {
                  if (!notification.read) markAsRead(notification.id);
                  // Navigate based on notification type
                  if (notification.type === 'order_update' && notification.data?.order_id) {
                    navigate('/cliente/meus-pedidos');
                  }
                }}
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
            <div className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Bell className="h-10 w-10 text-primary" />
            </div>
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
