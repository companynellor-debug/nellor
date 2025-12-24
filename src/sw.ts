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

// Handle push events (for future server push)
self.addEventListener('push', (event: PushEvent) => {
  console.log('🔔 SW Push event received');
  
  let data = {
    title: 'NELLOR',
    body: 'Nova notificação',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    url: '/fornecedor/pedidos',
    sound: true
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: 'nellor-' + Date.now(),
    requireInteraction: true,
    vibrate: [200, 100, 200],
    silent: false, // Permite som do sistema
    data: { url: data.url, sound: data.sound }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click - open app and navigate
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  console.log('🔔 SW Notification clicked');
  event.notification.close();

  const urlToOpen = (event.notification.data?.url as string) || '/fornecedor/pedidos';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus existing window
      for (const client of clientList) {
        if ('focus' in client && 'navigate' in client) {
          return (client as WindowClient).navigate(urlToOpen).then(() => (client as WindowClient).focus());
        }
      }
      // Open new window
      return self.clients.openWindow(urlToOpen);
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', () => {
  console.log('🔔 SW Notification closed');
});

// Handle messages from main thread (for showing notifications from app)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    console.log('🔔 SW received SHOW_NOTIFICATION message:', title);
    
    event.waitUntil(
      self.registration.showNotification(title, {
        body: options.body || '',
        icon: options.icon || '/pwa-192x192.png',
        badge: options.badge || '/pwa-192x192.png',
        tag: options.tag || 'nellor-' + Date.now(),
        requireInteraction: true,
        silent: false,
        data: { url: options.data?.url || '/fornecedor/pedidos' }
      } as NotificationOptions & { vibrate?: number[] })
    );
  }
  
  // Skip waiting quando solicitado
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Garantir que o SW seja ativado imediatamente
self.addEventListener('install', () => {
  console.log('🔧 SW installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('🔧 SW activated');
  event.waitUntil(self.clients.claim());
});
