self.addEventListener('push', event => {
  let data = {};
  if (event.data) {
    try { data = event.data.json(); } catch (e) {}
  }
  const title = data.title || 'Startup Connect';
  const options = {
    body: data.content || '',
    data: { id: data.id }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const id = event.notification.data && event.notification.data.id;
  const url = id ? `/notifications.html?id=${id}` : '/notifications.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(winClients => {
      for (const client of winClients) {
        if (client.url.includes('notifications.html')) {
          client.focus();
          if (id) client.postMessage({ type: 'notification-click', id });
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});
