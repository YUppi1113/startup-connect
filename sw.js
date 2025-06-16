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
