/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: any;
};

// Precache assets
precacheAndRoute(self.__WB_MANIFEST);

// Runtime caching
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'gstatic-fonts-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

registerRoute(
  ({ url }) => url.hostname.endsWith('.supabase.co'),
  new NetworkFirst({
    cacheName: 'supabase-api-cache',
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 5 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Handle push events - CRITICAL for background notifications
self.addEventListener('push', (event: PushEvent) => {
  console.log('🔔 [SW] Push event received at:', new Date().toISOString());
  
  // Default notification data
  let data = {
    title: 'NELLOR',
    body: 'Nova notificação',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    url: '/fornecedor/pedidos',
    tag: 'nellor-notification',
    order_number: '',
    type: 'general'
  };

  // Parse push payload
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('🔔 [SW] Push payload:', JSON.stringify(payload));
      data = { ...data, ...payload };
    } catch (e) {
      console.log('🔔 [SW] Push text fallback:', event.data.text());
      data.body = event.data.text();
    }
  }

  // Build unique tag for each notification type
  const notificationTag = data.order_number 
    ? `nellor-${data.type}-${data.order_number}` 
    : `nellor-${data.type}-${Date.now()}`;

  const options: NotificationOptions & { vibrate?: number[]; actions?: Array<{ action: string; title: string }> } = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: notificationTag,
    requireInteraction: true,
    vibrate: [300, 100, 300, 100, 300], // Strong vibration pattern
    silent: false,
    data: { 
      url: data.url,
      order_number: data.order_number,
      type: data.type,
      timestamp: Date.now()
    },
    actions: [
      { action: 'open', title: 'Ver Detalhes' },
      { action: 'dismiss', title: 'Dispensar' }
    ]
  };

  console.log('🔔 [SW] Showing notification:', data.title, options);

  event.waitUntil(
    self.registration.showNotification(data.title, options)
      .then(() => {
        console.log('🔔 [SW] Notification displayed successfully');
      })
      .catch((err) => {
        console.error('🔔 [SW] Failed to show notification:', err);
      })
  );
});

// Handle notification click - open app and navigate
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  const action = event.action;
  const notification = event.notification;
  
  console.log('🔔 [SW] Notification clicked:', {
    action,
    tag: notification.tag,
    data: notification.data
  });

  notification.close();

  // If user clicked dismiss, just close
  if (action === 'dismiss') {
    return;
  }

  const urlToOpen = notification.data?.url || '/fornecedor/pedidos';
  console.log('🔔 [SW] Opening URL:', urlToOpen);

  event.waitUntil(
    self.clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then((clientList) => {
      console.log('🔔 [SW] Found', clientList.length, 'client(s)');
      
      // Try to focus existing window and navigate
      for (const client of clientList) {
        if ('focus' in client && 'navigate' in client) {
          console.log('🔔 [SW] Navigating existing client to:', urlToOpen);
          return (client as WindowClient).navigate(urlToOpen)
            .then((navigatedClient) => navigatedClient?.focus());
        }
      }
      
      // Open new window if no existing client
      console.log('🔔 [SW] Opening new window:', urlToOpen);
      return self.clients.openWindow(urlToOpen);
    }).catch((err) => {
      console.error('🔔 [SW] Error handling notification click:', err);
    })
  );
});

// Handle notification close (for analytics)
self.addEventListener('notificationclose', (event: NotificationEvent) => {
  console.log('🔔 [SW] Notification closed:', {
    tag: event.notification.tag,
    data: event.notification.data
  });
});

// Handle messages from main thread (for showing notifications from app)
self.addEventListener('message', (event) => {
  console.log('🔔 [SW] Received message:', event.data?.type);
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    console.log('🔔 [SW] SHOW_NOTIFICATION:', title);
    
    const notificationTag = options?.data?.order_number
      ? `nellor-${options.data.type || 'msg'}-${options.data.order_number}`
      : `nellor-msg-${Date.now()}`;
    
    event.waitUntil(
      self.registration.showNotification(title, {
        body: options?.body || '',
        icon: options?.icon || '/pwa-192x192.png',
        badge: options?.badge || '/pwa-192x192.png',
        tag: notificationTag,
        requireInteraction: true,
        silent: false,
        vibrate: [300, 100, 300],
        data: { 
          url: options?.data?.url || '/fornecedor/pedidos',
          ...options?.data
        }
      } as NotificationOptions & { vibrate?: number[] })
    );
  }
  
  // Skip waiting when requested
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('🔔 [SW] Skipping waiting');
    self.skipWaiting();
  }
});

// Install - skip waiting immediately
self.addEventListener('install', () => {
  console.log('🔧 [SW] Installed - skipping waiting');
  self.skipWaiting();
});

// Activate - claim all clients immediately
self.addEventListener('activate', (event) => {
  console.log('🔧 [SW] Activated - claiming clients');
  event.waitUntil(self.clients.claim());
});
