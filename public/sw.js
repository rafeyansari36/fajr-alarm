const CACHE_NAME = 'fajr-alarm-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.svg',
];

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate - clean old caches + claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/')))
  );
});

// Handle alarm notifications from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'ALARM_TRIGGER') {
    self.registration.showNotification('Fajr Alarm', {
      body: event.data.message || 'Wake up for Fajr!',
      icon: '/favicon.svg',
      tag: 'fajr-alarm',
      requireInteraction: true,
      vibrate: [500, 200, 500, 200, 500, 200, 500],
      actions: [
        { action: 'open', title: 'Open App' },
      ],
    });
  }
});

// Handle notification click — bring the app to foreground
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if open
      for (const client of clients) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new one
      return self.clients.openWindow('/');
    })
  );
});

// --- Background Periodic Sync ---
// Checks alarms even when the app tab is backgrounded (Android Chrome)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-alarms') {
    event.waitUntil(checkAlarmsInBackground());
  }
});

async function checkAlarmsInBackground() {
  try {
    // Read alarm state from the main thread isn't possible directly,
    // so we notify any open clients to check their alarms
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      client.postMessage({ type: 'CHECK_ALARMS' });
    }

    // If no clients are open, show a persistent notification as a wake-up fallback
    if (clients.length === 0) {
      // We can't read localStorage from SW, but we can show a generic reminder
      // The main app will handle the actual alarm when opened
    }
  } catch {}
}

// --- Push event (for future push notification support) ---
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Fajr Alarm', {
      body: data.body || 'Time to wake up!',
      icon: '/favicon.svg',
      tag: 'fajr-alarm',
      requireInteraction: true,
      vibrate: [500, 200, 500, 200, 500, 200, 500],
    })
  );
});
