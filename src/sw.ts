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

// Runtime caching (keeps previous behavior)
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

// Handle push events from server (future use)
self.addEventListener('push', (event: PushEvent) => {
  console.log('🔔 Push event received:', event);
  
  let data = {
    title: 'NELLOR',
    body: 'Nova notificação',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    url: '/'
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
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    tag: 'nellor-notification-' + Date.now(),
    requireInteraction: true,
    silent: false,
    data: { url: data.url || '/' }
  } as NotificationOptions;

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Make notification taps open the right page (instead of copying a link / doing nothing)
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  console.log('🔔 Notification clicked:', event.notification);
  event.notification.close();

  const data = (event.notification.data || {}) as { url?: string };
  const urlToOpen = data.url || '/fornecedor/pedidos';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window and navigate
        for (const client of clientList) {
          if ('focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Or open a new one
        return self.clients.openWindow(urlToOpen);
      })
  );
});

// Close notification when action button is clicked
self.addEventListener('notificationclose', (event: NotificationEvent) => {
  console.log('🔔 Notification closed:', event.notification);
});
