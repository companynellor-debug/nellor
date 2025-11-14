import { Card } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { useSupabaseNotifications } from "@/hooks/useSupabaseNotifications";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import logo from "@/assets/logo.png";
const Notificacoes = () => {
  const {
    notifications,
    loading
  } = useSupabaseNotifications();
  if (loading) {
    return <div className="space-y-6">
        <h1 className="text-3xl font-bold">Notificações</h1>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Carregando...</p>
        </Card>
      </div>;
  }
  return <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Notificações</h1>
      </div>

      <div className="space-y-4 mx-0 px-0 my-0">
        {notifications.length === 0 ? <Card className="p-8 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma notificação no momento</p>
          </Card> : notifications.map(notification => {
        const orderData = notification.data as {
          order_number?: string;
          total?: number;
        } | null;
        const orderNumber = orderData?.order_number || '';
        const total = orderData?.total || 0;
        return <div key={notification.id} className={`relative rounded-xl overflow-hidden bg-gradient-to-r from-purple-900 via-purple-700 to-purple-500 text-white shadow-lg ${notification.read ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <img src={logo} alt="Logo" className="w-10 h-10 sm:w-14 sm:h-14 object-contain" />
                  </div>
                  
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h3 className="text-sm sm:text-lg font-bold mb-0.5 sm:mb-1 truncate">{notification.title}</h3>
                    <p className="text-xs sm:text-sm opacity-90 truncate">{notification.body}</p>
                    {total > 0 && (
                      <p className="text-xs sm:text-sm font-medium mt-0.5 sm:mt-1 truncate">Valor: R$ {total.toFixed(2).replace('.', ',')}</p>
                    )}
                  </div>

                  <div className="text-right flex flex-col justify-start gap-1 sm:gap-2 flex-shrink-0">
                    <div className="text-[10px] sm:text-xs font-medium whitespace-nowrap">
                      {format(new Date(notification.created_at), "HH:mm", {
                  locale: ptBR
                })}
                    </div>
                    <div className="text-[10px] sm:text-xs opacity-90 whitespace-nowrap">
                      {format(new Date(notification.created_at), "dd/MM", {
                  locale: ptBR
                })}
                    </div>
                    {orderNumber && (
                      <div className="text-[10px] sm:text-xs font-semibold tracking-wide truncate max-w-[80px] sm:max-w-none">
                        #{orderNumber}
                      </div>
                    )}
                  </div>
                </div>
              </div>;
      })}
      </div>
    </div>;
};
export default Notificacoes;