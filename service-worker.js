const CACHE_VERSION = 'v1.8.3';
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
    <svg viewBox="0 0 17 17" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="si-glyph si-glyph-music" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>115</title> <defs> </defs> <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <path d="M7.942,0.751 L6.035,0.042 L6.035,11.139 C5.433,11.089 4.75,11.176 4.111,11.438 C2.517,12.089 1.689,13.655 2.146,14.75 C2.604,15.848 4.175,16.354 5.767,15.703 C6.991,15.203 7.84,14.252 7.951,13.341 L7.943,3.524 C10.57,4.322 12.463,5.197 12.463,7.808 C12.463,8.735 13.983,9.631 13.983,5.996 C13.982,2.904 11.33,1.034 7.942,0.751 L7.942,0.751 Z" fill="#ffffff" class="si-glyph-fill"> </path> </g> </g></svg>
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
