// frontend/src/utils/notificationHelper.js
export const showAppNotification = async (title, body, url = '/') => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  try {
    // 1. Try using the active Service Worker (Required for Android & Mobile browsers)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, {
          body,
          icon: '/logo.png',
          badge: '/logo.png',
          vibrate: [200, 100, 200],
          data: { url }
        });
        return; // Successfully sent via Service Worker!
      }
    }
  } catch (err) {
    console.warn('Service Worker notification fallback error:', err);
  }

  // 2. Fallback for standard Desktop browsers if Service Worker isn't ready
  try {
    new Notification(title, {
      body,
      icon: '/logo.png',
      badge: '/logo.png'
    });
  } catch (desktopErr) {
    console.warn('Desktop notification error:', desktopErr);
  }
};