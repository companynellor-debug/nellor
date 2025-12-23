import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, ShoppingCart, DollarSign, AlertTriangle, Store, CreditCard, ChevronRight, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdminNotifications, AdminNotification, AdminNotificationType } from '@/hooks/useAdminNotifications';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

const getNotificationIcon = (type: AdminNotificationType) => {
  switch (type) {
    case 'sale':
      return <ShoppingCart className="h-4 w-4 text-green-500" />;
    case 'commission':
      return <DollarSign className="h-4 w-4 text-purple-500" />;
    case 'alert':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'supplier':
      return <Store className="h-4 w-4 text-blue-500" />;
    case 'payment':
      return <CreditCard className="h-4 w-4 text-red-500" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
};

const getTypeLabel = (type: AdminNotificationType) => {
  switch (type) {
    case 'sale':
      return 'Venda';
    case 'commission':
      return 'Comissão';
    case 'alert':
      return 'Alerta';
    case 'supplier':
      return 'Fornecedor';
    case 'payment':
      return 'Pagamento';
    default:
      return 'Notificação';
  }
};

const getTypeBadgeColor = (type: AdminNotificationType) => {
  switch (type) {
    case 'sale':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'commission':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    case 'alert':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'supplier':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'payment':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const NotificationItem = ({ 
  notification, 
  onMarkAsRead 
}: { 
  notification: AdminNotification; 
  onMarkAsRead: (id: string) => void;
}) => {
  return (
    <div 
      className={cn(
        "p-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer",
        !notification.read && "bg-primary/5"
      )}
      onClick={() => !notification.read && onMarkAsRead(notification.id)}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
              getTypeBadgeColor(notification.type)
            )}>
              {getTypeLabel(notification.type)}
            </span>
            {!notification.read && (
              <span className="h-2 w-2 rounded-full bg-primary" />
            )}
          </div>
          <p className="text-sm font-medium text-foreground truncate">
            {notification.title}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {notification.body}
          </p>
          <div className="flex items-center justify-between mt-1">
            {notification.value != null && (
              <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                R$ {notification.value.toFixed(2).replace('.', ',')}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground">
              {format(new Date(notification.created_at), "dd/MM HH:mm", { locale: ptBR })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminNotificationDropdown = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    loading,
    notificationPermission,
    requestPermission
  } = useAdminNotifications();
  const [open, setOpen] = useState(false);

  const recentNotifications = notifications.slice(0, 5);

  const handleEnableNotifications = async () => {
    await requestPermission();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-red-500 hover:bg-red-500"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="font-semibold text-sm">Notificações</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto py-1 px-2 text-xs"
              onClick={(e) => {
                e.preventDefault();
                markAllAsRead();
              }}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar lidas
            </Button>
          )}
        </div>
        
        {/* Banner para ativar notificações */}
        {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && (
          <div className="p-3 border-b border-border bg-primary/5">
            <div className="flex items-center gap-2 text-xs">
              <BellRing className="h-4 w-4 text-primary flex-shrink-0" />
              <p className="flex-1 text-muted-foreground">
                Ative as notificações push para não perder nenhum pedido!
              </p>
            </div>
            <Button
              size="sm"
              className="w-full mt-2 h-7 text-xs"
              onClick={handleEnableNotifications}
            >
              Ativar Notificações
            </Button>
          </div>
        )}

        <ScrollArea className="max-h-[300px]">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Carregando...
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Nenhuma notificação
            </div>
          ) : (
            recentNotifications.map(notification => (
              <NotificationItem 
                key={notification.id} 
                notification={notification}
                onMarkAsRead={markAsRead}
              />
            ))
          )}
        </ScrollArea>

        <div className="p-2 border-t border-border">
          <Link 
            to="/admin/notificacoes" 
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1 text-xs text-primary hover:underline py-1"
          >
            Ver todas as notificações
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AdminNotificationDropdown;
