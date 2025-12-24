import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getNotificationPermission, requestNotificationPermission } from '@/utils/pushNotifications';

export const NotificationPermissionBanner = () => {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setPermission(getNotificationPermission());
    const wasDismissed = localStorage.getItem('notification-banner-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermission(getNotificationPermission());
    if (granted) {
      setDismissed(true);
      localStorage.setItem('notification-banner-dismissed', 'true');
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('notification-banner-dismissed', 'true');
  };

  // Don't show if already granted, denied, unsupported, or dismissed
  if (permission === 'granted' || permission === 'denied' || permission === 'unsupported' || dismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20 px-4 py-3">
      <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-full">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Ative as notificações push
            </p>
            <p className="text-xs text-muted-foreground">
              Receba alertas instantâneos quando um novo pedido pago chegar
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            onClick={handleRequestPermission}
            className="bg-primary hover:bg-primary/90"
          >
            Ativar Notificações
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={handleDismiss}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
