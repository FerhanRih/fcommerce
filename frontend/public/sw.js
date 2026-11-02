// frontend/public/sw.js
self.addEventListener('push', function (event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'FCOMMERCE Notification';
  const options = {
    body: data.body || 'You have a new announcement from FCOMMERCE.',
    icon: '/logo.png',
    badge: '/logo.png',
    data: { url: data.url || '/' }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});