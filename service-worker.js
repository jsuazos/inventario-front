const CACHE_VERSION = 'v1.8.2';
const CACHE_NAME = `musica-inventario-${CACHE_VERSION}`;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    ).then(() => self.clients.claim())
    .catch(() => {})
  );
});

self.addEventListener('fetch', event => {
  if (
    event.request.destination === 'image' &&
    (event.request.url.includes('i.discogs.com') ||
     event.request.url.includes('img.discogs.com') ||
     event.request.url.includes('musicbrainz.org') ||
     event.request.url.includes('fanart.tv'))
  ) {
    event.respondWith(
      caches.match(event.request).then(response => {
        if (response) return response;
        return fetch(event.request, { signal: AbortSignal.timeout(5000) })
          .then(networkResponse => {
            if (networkResponse.ok && networkResponse.status !== 429) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            }
            return networkResponse;
          })
          .catch(() => new Response('', { status: 503 }));
      })
    );
    return;
  }

  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request).then(cached => cached || new Response('Offline', { status: 503 }))
      )
    );
    return;
  }
});

self.addEventListener('message', event => {
  if (event.data === 'GET_CACHE_VERSION') {
    event.source.postMessage({ cacheVersion: CACHE_VERSION });
  } else if (event.data && event.data.type === 'GET_CACHE_VERSION') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ cacheVersion: CACHE_VERSION });
    }
  }
});

self.addEventListener('push', event => {
  const iconUrl = new URL('./img/music_icon_192.png', self.registration.scope).href;
  const badgeUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
      <path fill="#ffffff" d="M60 14c-4.4 0-8 3.6-8 8v31.5c-2.9-2.6-7-4.2-11.6-4.2-9.2 0-16.7 6-16.7 13.4S31.2 76 40.4 76s16.6-6 16.6-13.3V33.5l22-5.2v17.2c-2.9-2.6-7-4.2-11.6-4.2-9.2 0-16.7 6-16.7 13.4S58.2 68 67.4 68 84 62 84 54.7V21.3c0-4.9-4.5-8.6-9.2-7.5L60 17.2V22c0-1.1.9-2 2-2h11.8l-16.3 3.8c-.9.2-1.5 1-1.5 1.9v36.9c0 4.4-6.6 8.3-15.6 8.3s-15.7-3.9-15.7-8.3 6.7-8.4 15.7-8.4c4.9 0 9.2 1.2 12.2 3.5l2.4 1.8V22c0-2.9 2-5.4 4.8-6l14.8-3.4c.9-.2 1.8 0 2.5.6.7.6 1.1 1.4 1.1 2.3v39.2c0 4.4-6.6 8.3-15.6 8.3s-15.7-3.9-15.7-8.3 6.7-8.4 15.7-8.4c4.9 0 9.2 1.2 12.2 3.5l2.4 1.8V25.9l-22 5.2V22c0-4.4 3.6-8 8-8h2z"/>
    </svg>
  `);
  let data = { title: 'Inventario Musical', body: '', icon: iconUrl, badge: badgeUrl };
  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch (err) {
    data.body = event.data.text() || data.body;
  }

  const options = {
    body: data.body,
    icon: data.icon || iconUrl,
    badge: data.badge || badgeUrl,
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Cerrar' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'close') return;

  const scopeUrl = new URL(self.registration.scope);
  const requestedUrl = event.notification.data?.url;
  const urlToOpen = !requestedUrl || requestedUrl === '/'
    ? scopeUrl.href
    : new URL(requestedUrl, scopeUrl).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      const matchingClient = windowClients.find(client => {
        if (!('focus' in client)) return false;

        try {
          const clientUrl = new URL(client.url);
          return clientUrl.href === urlToOpen || clientUrl.href.startsWith(scopeUrl.href);
        } catch {
          return false;
        }
      });

      if (matchingClient) {
        return matchingClient.focus().then(client => {
          client?.postMessage({ type: 'NOTIFICATION_OPENED' });
          return client;
        });
      }

      return clients.openWindow(urlToOpen).then(client => {
        client?.postMessage({ type: 'NOTIFICATION_OPENED' });
        return client;
      });
    })
  );
});
