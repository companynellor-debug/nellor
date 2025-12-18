import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  CheckCheck, 
  ShoppingCart, 
  DollarSign, 
  AlertTriangle, 
  Store, 
  CreditCard,
  ExternalLink,
  Clock
} from 'lucide-react';
import { useAdminNotifications, AdminNotification, AdminNotificationType } from '@/hooks/useAdminNotifications';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';

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

const getTypeIcon = (type: AdminNotificationType) => {
  switch (type) {
    case 'sale':
      return <ShoppingCart className="h-4 w-4" />;
    case 'commission':
      return <DollarSign className="h-4 w-4" />;
    case 'alert':
      return <AlertTriangle className="h-4 w-4" />;
    case 'supplier':
      return <Store className="h-4 w-4" />;
    case 'payment':
      return <CreditCard className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
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
  // Use the commission from the notification if available, otherwise calculate
  const commission = notification.commission ?? (notification.value ? notification.value * 0.075 : null);

  return (
    <div 
      className={cn(
        "relative rounded-xl overflow-hidden bg-gradient-to-r from-purple-900 via-purple-700 to-purple-500 text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-xl cursor-pointer",
        notification.read && "opacity-70"
      )}
      onClick={() => !notification.read && onMarkAsRead(notification.id)}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Logo */}
        <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
          <img src={logo} alt="Nellor" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm font-medium flex items-center gap-1">
              {getTypeIcon(notification.type)}
              {getTypeLabel(notification.type)}
            </span>
            {!notification.read && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-400 text-green-900 font-bold">
                Nova
              </span>
            )}
          </div>
          
          <h3 className="text-sm md:text-base font-bold mb-0.5 truncate">
            {notification.title}
          </h3>
          <p className="text-xs md:text-sm opacity-90 line-clamp-1">
            {notification.body}
          </p>
          
          {/* Supplier Name */}
          {notification.supplier_name && notification.type === 'sale' && (
            <p className="text-[11px] text-white/70 mt-0.5">
              Fornecedor: <span className="font-medium text-white/90">{notification.supplier_name}</span>
            </p>
          )}
          
          {/* Values */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {notification.value != null && notification.type !== 'commission' && (
              <div className="flex items-center gap-1.5 bg-black/30 rounded-lg px-2 py-1">
                <span className="text-[10px] text-white/70">Valor:</span>
                <span className="text-xs md:text-sm font-bold text-white">
                  R$ {notification.value.toFixed(2).replace('.', ',')}
                </span>
              </div>
            )}
            {notification.type === 'sale' && commission != null && (
              <div className="flex items-center gap-1.5 bg-black/30 rounded-lg px-2 py-1">
                <span className="text-[10px] text-white/70">Comissão 7,5%:</span>
                <span className="text-xs md:text-sm font-bold text-green-300">
                  R$ {commission.toFixed(2).replace('.', ',')}
                </span>
              </div>
            )}
            {notification.type === 'commission' && notification.value != null && (
              <div className="flex items-center gap-1.5 bg-green-500/30 rounded-lg px-2.5 py-1.5">
                <DollarSign className="h-4 w-4 text-green-300" />
                <span className="text-sm font-bold text-green-300">
                  + R$ {notification.value.toFixed(2).replace('.', ',')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer with time and link */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/40">
        <div className="flex items-center gap-1.5 text-white/80">
          <Clock className="h-3 w-3" />
          <span className="text-[11px]">
            {format(new Date(notification.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </span>
        </div>
        
        {link && (
          <Link 
            to={link}
            className="flex items-center gap-1 text-[11px] text-white/90 hover:text-white transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            Ver detalhes
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
};

const FilterButton = ({ 
  active, 
  onClick, 
  icon, 
  label, 
  count 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string; 
  count: number;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-sm font-medium",
      active 
        ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/30" 
        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
    )}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
    <Badge 
      variant="secondary" 
      className={cn(
        "ml-1 text-[10px] px-1.5",
        active ? "bg-white/20 text-white" : "bg-zinc-700 text-zinc-300"
      )}
    >
      {count}
    </Badge>
  </button>
);

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

  const filters = [
    { value: 'all', label: 'Todas', icon: <Bell className="h-4 w-4" />, count: notifications.length },
    { value: 'sale', label: 'Vendas', icon: <ShoppingCart className="h-4 w-4" />, count: getNotificationsByType('sale').length },
    { value: 'commission', label: 'Comissões', icon: <DollarSign className="h-4 w-4" />, count: getNotificationsByType('commission').length },
    { value: 'alert', label: 'Alertas', icon: <AlertTriangle className="h-4 w-4" />, count: getNotificationsByType('alert').length },
    { value: 'supplier', label: 'Fornecedores', icon: <Store className="h-4 w-4" />, count: getNotificationsByType('supplier').length },
    { value: 'payment', label: 'Pagamentos', icon: <CreditCard className="h-4 w-4" />, count: getNotificationsByType('payment').length },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-4 md:p-6">
        <h1 className="text-3xl font-bold text-white mb-6">Notificações</h1>
        <Card className="p-8 text-center bg-zinc-900 border-zinc-800">
          <p className="text-zinc-400">Carregando...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-400 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Bell className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Notificações</h1>
            <p className="text-sm text-zinc-400">
              {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Todas lidas'}
            </p>
          </div>
        </div>
        
        {unreadCount > 0 && (
          <Button
            onClick={markAllAsRead}
            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-zinc-800">
        {filters.map(filter => (
          <FilterButton
            key={filter.value}
            active={activeTab === filter.value}
            onClick={() => setActiveTab(filter.value)}
            icon={filter.icon}
            label={filter.label}
            count={filter.count}
          />
        ))}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card className="p-8 text-center bg-zinc-900 border-zinc-800">
          <Bell className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400">
            {activeTab === 'all' 
              ? 'Nenhuma notificação no momento' 
              : `Nenhuma notificação de ${filters.find(f => f.value === activeTab)?.label.toLowerCase()}`
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
    </div>
  );
};

export default NotificacoesAdmin;
