import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck } from "lucide-react";
import { useSupabaseNotifications } from "@/hooks/useSupabaseNotifications";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import logo from "@/assets/logo.png";
const Notificacoes = () => {
  const {
    notifications,
    loading,
    markAllAsRead,
    unreadCount
  } = useSupabaseNotifications();
  return <div className="space-y-4 md:space-y-6 w-full overflow-hidden px-2 md:px-0">
      <div className="flex items-center justify-between gap-2 md:gap-3">
        <div className="flex items-center gap-2 md:gap-3">
          <Bell className="h-6 w-6 md:h-8 md:w-8 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold">Notificações</h1>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="flex items-center gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Marcar todas como lidas</span>
            <span className="sm:hidden">Marcar lidas</span>
          </Button>
        )}
      </div>

      <div className="space-y-3 md:space-y-4 w-full mx-0 px-0 py-0 my-0">
        {notifications.length === 0 ? <Card className="p-6 md:p-8 text-center">
            <Bell className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma notificação no momento</p>
          </Card> : notifications.map(notification => {
        const orderData = notification.data as {
          order_number?: string;
          total?: number;
        } | null;
        const orderNumber = orderData?.order_number || '';
        const total = orderData?.total;
        return <div key={notification.id} className={`relative rounded-lg md:rounded-xl overflow-hidden bg-gradient-to-r from-purple-900 via-purple-700 to-purple-500 text-white shadow-lg w-full ${notification.read ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-2 p-3 md:p-4 w-full min-w-0">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <img src={logo} alt="Logo" className="w-8 h-8 md:w-12 md:h-12 object-contain" />
                  </div>
                  
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h3 className="text-xs md:text-base font-bold mb-0.5 truncate">{notification.title}</h3>
                    <p className="text-[10px] md:text-sm opacity-90 truncate">{notification.body}</p>
                    {total != null && total !== undefined && <p className="text-[10px] md:text-sm font-medium mt-0.5 md:mt-1 truncate">R$ {total.toFixed(2).replace('.', ',')}</p>}
                  </div>

                  
                </div>
              </div>;
      })}
      </div>
    </div>;
};
export default Notificacoes;