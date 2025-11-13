import { Card } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { useSupabaseNotifications } from "@/hooks/useSupabaseNotifications";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import logo from "@/assets/logo.png";

const Notificacoes = () => {
  const { notifications, loading } = useSupabaseNotifications();

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

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card className="p-8 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma notificação no momento</p>
          </Card>
        ) : (
          notifications.map((notification) => {
            return (
              <div 
                key={notification.id} 
                className={`relative rounded-2xl p-6 bg-gradient-to-r from-purple-900 via-purple-700 to-purple-500 text-white shadow-lg ${notification.read ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <img src={logo} alt="Logo" className="w-16 h-16 object-contain" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-1">{notification.title}</h3>
                    <p className="text-lg opacity-90">{notification.body}</p>
                  </div>

                  <div className="text-right text-sm opacity-75">
                    {format(new Date(notification.created_at), "HH:mm", { locale: ptBR })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notificacoes;
