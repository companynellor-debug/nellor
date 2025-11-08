import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Package, MessageSquare, XCircle, CheckCircle, Bell, DollarSign, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  created_at: string;
  read: boolean;
}

const Notificacoes = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'order_update': return Package;
      case 'message': return MessageSquare;
      case 'payout': return DollarSign;
      default: return Bell;
    }
  };

  const getColor = (type: string) => {
    switch(type) {
      case 'order_update': return 'text-blue-600';
      case 'message': return 'text-green-600';
      case 'payout': return 'text-purple-600';
      default: return 'text-primary';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Notificações</h1>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Carregando...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Notificações</h1>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card className="p-8 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma notificação no momento</p>
          </Card>
        ) : (
          notifications.map((notification) => {
            const Icon = getIcon(notification.type);
            const iconColor = getColor(notification.type);
            return (
              <Card key={notification.id} className={`p-4 ${notification.read ? 'opacity-60' : ''} border-none bg-card hover:shadow-md transition-shadow`}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full bg-muted`}>
                    <Icon className={`h-6 w-6 ${iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{notification.title}</h3>
                    <p className="text-muted-foreground">{notification.body}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(new Date(notification.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notificacoes;
