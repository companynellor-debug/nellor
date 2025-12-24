// Utility functions for PWA push notifications

export const requestNotificationPermission = async (): Promise<boolean> => {
  // Check if notifications are supported
  if (!('Notification' in window)) {
    console.log('❌ Notifications not supported in this browser');
    return false;
  }

  // Already granted
  if (Notification.permission === 'granted') {
    console.log('✅ Notification permission already granted');
    return true;
  }

  // Request permission if not denied
  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      console.log('📱 Permission result:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('❌ Error requesting permission:', error);
      return false;
    }
  }

  console.log('❌ Notification permission was denied');
  return false;
};

export const getNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

// Check if we're on iOS
const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

// Check if running as PWA
const isPWA = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches 
    || (window.navigator as any).standalone === true;
};

export const showPushNotification = async (
  title: string,
  options?: NotificationOptions
): Promise<void> => {
  console.log('🔔 showPushNotification called:', title);

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    console.log('❌ No notification permission');
    return;
  }

  const notifData = {
    url: '/fornecedor/pedidos',
    ...(options?.data as Record<string, unknown> || {}),
  };

  const notifOptions = {
    body: options?.body || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: options?.tag || `nellor-${Date.now()}`,
    requireInteraction: true,
    silent: false,
    data: notifData,
  };

  // Add vibration for mobile
  if ('vibrate' in navigator) {
    (notifOptions as any).vibrate = [200, 100, 200];
  }

  try {
    // Method 1: Use Service Worker postMessage (most reliable for mobile PWA)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      console.log('📱 Using SW postMessage for notification');
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        options: notifOptions
      });
      return;
    }

    // Method 2: Use Service Worker registration.showNotification
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      console.log('📱 Using SW registration.showNotification');
      await registration.showNotification(title, notifOptions);
      return;
    }

    // Method 3: Fallback to Notification API (desktop/foreground only)
    console.log('📱 Using Notification API fallback');
    const notification = new Notification(title, notifOptions);
    notification.onclick = () => {
      window.focus();
      if (notifData.url) {
        window.location.href = notifData.url;
      }
      notification.close();
    };
  } catch (error) {
    console.error('❌ Error showing notification:', error);
    
    // Last resort fallback
    try {
      const notification = new Notification(title, {
        body: options?.body || '',
        icon: '/pwa-192x192.png'
      });
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (e) {
      console.error('❌ All notification methods failed:', e);
    }
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
