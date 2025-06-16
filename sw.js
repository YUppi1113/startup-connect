const CACHE_NAME = 'startup-connect-cache-v1';
const ASSETS = [
  '/styles/styles.css',
  '/index.html',
  '/login.html',
  '/register.html',
  '/reset-password.html',
  '/verify.html',
  '/dashboard.html',
  '/events.html',
  '/event-detail.html',
  '/search.html',
  '/messages.html',
  '/groups.html',
  '/profile.html',
  '/profile-detail.html',
  '/projects.html',
  '/connections.html',
  '/notifications.html',
  '/settings.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (!['document', 'style', 'image'].includes(event.request.destination)) return;

  event.respondWith(
    caches.match(event.request).then(resp => {
      if (resp) return resp;
      return fetch(event.request)
        .then(networkResp => {
          if (networkResp && networkResp.status === 200) {
            const clone = networkResp.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return networkResp;
        })
        .catch(() => caches.match('/index.html'));
    })
  );
});

self.addEventListener('push', event => {
  let data = {};
  if (event.data) {
    try { data = event.data.json(); } catch (e) { data = {}; }
  }
  const title = data.title || 'Startup Connect';
  const options = {
    body: data.body || '',
    data: { url: data.url || '/', id: data.id },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const { url, id } = event.notification.data || { url: '/' };
  event.waitUntil((async () => {
    if (id) {
      try {
        await fetch('/mark_notification', { method: 'POST', body: JSON.stringify({ id }) });
      } catch (e) { /* ignore */ }
    }
    const allClients = await self.clients.matchAll({ type: 'window' });
    for (const client of allClients) {
      if (client.url === url && 'focus' in client) return client.focus();
    }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  })());
});
