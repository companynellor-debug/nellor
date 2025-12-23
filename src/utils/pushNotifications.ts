// Utility functions for PWA push notifications

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const getNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

export const showPushNotification = async (
  title: string,
  options?: NotificationOptions
): Promise<Notification | null> => {
  const hasPermission = await requestNotificationPermission();
  
  if (!hasPermission) {
    console.log('Notification permission not granted');
    return null;
  }

  const defaultOptions: NotificationOptions = {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    requireInteraction: false,
    ...options,
  };

  try {
    // Try to use Service Worker notifications first (works in background)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, defaultOptions);
      return null;
    } else {
      // Fallback to regular Notification API
      return new Notification(title, defaultOptions);
    }
  } catch (error) {
    console.error('Error showing notification:', error);
    return null;
  }
};

export const showOrderNotification = async (
  orderNumber: string,
  total: number,
  buyerName?: string
) => {
  const title = '🛒 Novo Pedido Recebido!';
  const body = `Pedido #${orderNumber} - R$ ${total.toFixed(2)}${buyerName ? ` de ${buyerName}` : ''}`;

  await showPushNotification(title, {
    body,
    tag: `order-${orderNumber}`,
    data: { type: 'order', orderNumber },
  });
};

export const showSupplierNotification = async (
  supplierName: string,
  type: 'registered' | 'stripe_connected'
) => {
  const title = type === 'stripe_connected' 
    ? '💳 Stripe Conectado!' 
    : '🏪 Novo Fornecedor!';
  const body = type === 'stripe_connected'
    ? `${supplierName} conectou sua conta Stripe`
    : `${supplierName} se cadastrou na plataforma`;

  await showPushNotification(title, {
    body,
    tag: `supplier-${supplierName}`,
    data: { type: 'supplier', supplierName },
  });
};

export const showPaymentNotification = async (
  orderNumber: string,
  total: number,
  status: 'paid' | 'failed' | 'refunded'
) => {
  const statusMap = {
    paid: { emoji: '✅', text: 'Pagamento Confirmado' },
    failed: { emoji: '❌', text: 'Pagamento Falhou' },
    refunded: { emoji: '↩️', text: 'Reembolso Processado' }
  };

  const { emoji, text } = statusMap[status];
  const title = `${emoji} ${text}!`;
  const body = `Pedido #${orderNumber} - R$ ${total.toFixed(2)}`;

  await showPushNotification(title, {
    body,
    tag: `payment-${orderNumber}`,
    data: { type: 'payment', orderNumber, status },
  });
};
