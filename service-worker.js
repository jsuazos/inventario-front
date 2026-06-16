const CACHE_VERSION = 'v1.8.0';
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
  const ICON = './img/music_icon_192.png';
  let data = { title: 'Inventario Musical', body: '', icon: ICON };
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
    icon: data.icon,
    badge: ICON,
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

  const urlToOpen = event.notification.data?.url || './';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      const matchingClient = windowClients.find(client =>
        client.url.includes(urlToOpen) && 'focus' in client
      );
      if (matchingClient) {
        return matchingClient.focus();
      }
      return clients.openWindow(urlToOpen);
    })
  );
});
