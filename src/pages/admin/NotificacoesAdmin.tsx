import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  CheckCheck, 
  ShoppingCart, 
  DollarSign, 
  AlertTriangle, 
  Store, 
  CreditCard,
  ExternalLink,
  Filter
} from 'lucide-react';
import { useAdminNotifications, AdminNotification, AdminNotificationType } from '@/hooks/useAdminNotifications';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const getNotificationIcon = (type: AdminNotificationType) => {
  switch (type) {
    case 'sale':
      return <ShoppingCart className="h-5 w-5 text-green-500" />;
    case 'commission':
      return <DollarSign className="h-5 w-5 text-purple-500" />;
    case 'alert':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'supplier':
      return <Store className="h-5 w-5 text-blue-500" />;
    case 'payment':
      return <CreditCard className="h-5 w-5 text-red-500" />;
    default:
      return <Bell className="h-5 w-5 text-muted-foreground" />;
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

const getReferenceLink = (notification: AdminNotification) => {
  if (!notification.reference_id) return null;
  
  switch (notification.reference_type) {
    case 'order':
      return `/admin/vendas?pedido=${notification.reference_id}`;
    case 'supplier':
      return `/admin/fornecedores?id=${notification.reference_id}`;
    case 'payout':
      return `/admin/saques?id=${notification.reference_id}`;
    default:
      return null;
  }
};

const NotificationCard = ({ 
  notification, 
  onMarkAsRead 
}: { 
  notification: AdminNotification; 
  onMarkAsRead: (id: string) => void;
}) => {
  const link = getReferenceLink(notification);

  return (
    <Card 
      className={cn(
        "p-4 transition-all hover:shadow-md cursor-pointer",
        !notification.read && "border-l-4 border-l-primary bg-primary/5"
      )}
      onClick={() => !notification.read && onMarkAsRead(notification.id)}
    >
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-full bg-muted">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium",
              getTypeBadgeColor(notification.type)
            )}>
              {getTypeLabel(notification.type)}
            </span>
            {!notification.read && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0">
                Nova
              </Badge>
            )}
          </div>
          
          <h3 className="font-semibold text-foreground mb-1">
            {notification.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-2">
            {notification.body}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {notification.value != null && (
                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                  R$ {notification.value.toFixed(2).replace('.', ',')}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {format(new Date(notification.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
            
            {link && (
              <Link 
                to={link}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Ver detalhes
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

const NotificacoesAdmin = () => {
  const { 
    notifications, 
    loading, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    getNotificationsByType 
  } = useAdminNotifications();
  
  const [activeTab, setActiveTab] = useState<string>('all');

  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : getNotificationsByType(activeTab as AdminNotificationType);

  const tabs = [
    { value: 'all', label: 'Todas', count: notifications.length },
    { value: 'sale', label: 'Vendas', count: getNotificationsByType('sale').length },
    { value: 'commission', label: 'Comissões', count: getNotificationsByType('commission').length },
    { value: 'alert', label: 'Alertas', count: getNotificationsByType('alert').length },
    { value: 'supplier', label: 'Fornecedores', count: getNotificationsByType('supplier').length },
    { value: 'payment', label: 'Pagamentos', count: getNotificationsByType('payment').length },
  ];

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Notificações</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Todas lidas'}
            </p>
          </div>
        </div>
        
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={markAllAsRead}
            className="flex items-center gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {tabs.slice(1).map(tab => (
          <Card 
            key={tab.value} 
            className={cn(
              "p-4 cursor-pointer transition-all hover:shadow-md",
              activeTab === tab.value && "ring-2 ring-primary"
            )}
            onClick={() => setActiveTab(tab.value)}
          >
            <div className="flex items-center gap-2">
              {getNotificationIcon(tab.value as AdminNotificationType)}
              <div>
                <p className="text-2xl font-bold">{tab.count}</p>
                <p className="text-xs text-muted-foreground">{tab.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs Filter */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          {tabs.map(tab => (
            <TabsTrigger 
              key={tab.value} 
              value={tab.value}
              className="flex items-center gap-2"
            >
              <Filter className="h-3 w-3" />
              {tab.label}
              {tab.count > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px]">
                  {tab.count}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredNotifications.length === 0 ? (
            <Card className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {activeTab === 'all' 
                  ? 'Nenhuma notificação no momento' 
                  : `Nenhuma notificação de ${tabs.find(t => t.value === activeTab)?.label.toLowerCase()}`
                }
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map(notification => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificacoesAdmin;
