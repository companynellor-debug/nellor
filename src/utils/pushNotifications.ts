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

// Função para tocar som de notificação
const playNotificationSoundInApp = () => {
  try {
    const audio = new Audio('/notification-sound.mp3');
    audio.volume = 0.8;
    audio.play().catch(error => {
      console.log('🔇 Could not play notification sound:', error);
    });
  } catch (error) {
    console.log('🔇 Error creating audio:', error);
  }
};

// Listener para mensagens do Service Worker pedindo para tocar som
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'PLAY_NOTIFICATION_SOUND') {
      console.log('🔊 Received PLAY_NOTIFICATION_SOUND from SW');
      playNotificationSoundInApp();
    }
  });
}

export const showPushNotification = async (
  title: string,
  options?: NotificationOptions
): Promise<void> => {
  console.log('🔔 showPushNotification called:', title);

  // Check permission first
  if (!('Notification' in window)) {
    console.log('❌ Notifications not supported');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.log('❌ No notification permission, requesting...');
    const granted = await requestNotificationPermission();
    if (!granted) {
      console.log('❌ Permission denied');
      return;
    }
  }

  const notifData = {
    url: '/fornecedor/pedidos',
    ...(options?.data as Record<string, unknown> || {}),
  };

  const notifOptions: NotificationOptions = {
    body: options?.body || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: options?.tag || `nellor-${Date.now()}`,
    requireInteraction: true,
    silent: false,
    data: notifData,
  };

  // Toca som no app
  playNotificationSoundInApp();

  try {
    // Para mobile PWA: usa Service Worker registration.showNotification
    // Esta é a forma mais confiável para Android e iOS
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        if (registration) {
          console.log('📱 Using SW registration.showNotification (mobile compatible)');
          await registration.showNotification(title, {
            body: notifOptions.body,
            icon: notifOptions.icon,
            badge: notifOptions.badge,
            tag: notifOptions.tag,
            requireInteraction: true,
            silent: false,
            data: notifData,
          } as NotificationOptions);
          console.log('✅ Notification sent via SW registration');
          return;
        }
      } catch (swError) {
        console.log('⚠️ SW registration.showNotification failed:', swError);
      }
    }

    // Fallback: API direta (funciona apenas em foreground/desktop)
    console.log('📱 Using Notification API fallback');
    const notification = new Notification(title, {
      body: notifOptions.body || '',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: notifOptions.tag,
      requireInteraction: true,
      silent: false,
    });
    
    notification.onclick = () => {
      window.focus();
      if (notifData.url) {
        window.location.href = notifData.url;
      }
      notification.close();
    };
    
    console.log('✅ Notification sent via Notification API');
  } catch (error) {
    console.error('❌ Error showing notification:', error);
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
