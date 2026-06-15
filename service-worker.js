const CACHE_VERSION = 'v1.7.6';
const CACHE_NAME = `musica-inventario-${CACHE_VERSION}`;
const DATA_CACHE_NAME = 'library-data-v1';

const isDevelopment = self.location.hostname === 'localhost' ||
                      self.location.hostname === '127.0.0.1' ||
                      self.location.hostname.includes('localhost') ||
                      self.location.hostname.includes('127.0.0.1');

const BASE_PATH = isDevelopment ? '/' : '/inventario-front/';
const urlsToCache = [
  `${BASE_PATH}`,
  `${BASE_PATH}src/services/configService.js`,
  `${BASE_PATH}src/services/api.js`,
  `${BASE_PATH}src/services/libraryService.js`,
  `${BASE_PATH}src/services/artistService.js`,
  `${BASE_PATH}src/services/storageService.js`,
  `${BASE_PATH}src/services/dbService.js`,
  `${BASE_PATH}src/state/libraryStore.js`,
  `${BASE_PATH}src/utils/filters.js`,
  `${BASE_PATH}src/utils/hexToRgba.js`,
  `${BASE_PATH}src/utils/obtenerGeneros.js`,
  `${BASE_PATH}src/utils/obtenerColorPorGenero.js`,
  `${BASE_PATH}src/utils/obtenerTopEstilos.js`,
  `${BASE_PATH}src/utils/aplicarColoresPorGenero.js`,
  `${BASE_PATH}src/utils/ui.js`,
  `${BASE_PATH}src/utils/modals.js`,
  `${BASE_PATH}src/utils/libraryDisplay.js`,
  `${BASE_PATH}src/utils/libraryFilters.js`,
  `${BASE_PATH}src/main.js`,
  `${BASE_PATH}src/components/Navbar.js`,
  `${BASE_PATH}src/components/Aside.js`,
  `${BASE_PATH}src/components/Filters.js`,
  `${BASE_PATH}src/components/Loader.js`,
  `${BASE_PATH}src/components/LoginModal.js`,
  `${BASE_PATH}src/components/Alphabet.js`,
  `${BASE_PATH}src/components/Footer.js`,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}manifest.json`,
  `${BASE_PATH}src/styles/main.css`,
  `${BASE_PATH}img/music_icon_192.png`,
  `${BASE_PATH}img/music_icon_512.png`,
  `${BASE_PATH}img/music_library_icon.ico`
];

self.addEventListener('install', event => {
  console.log(`Service Worker ${CACHE_VERSION} instalando...`);
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      const filesToCache = isDevelopment ? urlsToCache.slice(0, 10) : urlsToCache;
      const batchSize = 3;

      for (let i = 0; i < filesToCache.length; i += batchSize) {
        const batch = filesToCache.slice(i, i + batchSize);

        await Promise.all(batch.map(async url => {
          try {
            const response = await fetch(url, { cache: 'no-cache' });
            if (response.ok) {
              await cache.put(url, response);
            }
          } catch (err) {
            console.warn(`Error cacheando ${url}:`, err.message);
          }
        }));

        if (i + batchSize < filesToCache.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== DATA_CACHE_NAME)
          .map(name => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith(self.location.origin)) {
    if (event.request.url.includes('i.discogs.com') ||
        event.request.url.includes('img.discogs.com') ||
        event.request.url.includes('musicbrainz.org') ||
        event.request.url.includes('fanart.tv')) {

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
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response;

      return fetch(event.request).then(networkResponse => {
        if (networkResponse.ok) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(error => {
        if (event.request.mode === 'navigate') {
          return caches.match(`${BASE_PATH}index.html`);
        }
        return new Response('Network Error', { status: 503 });
      });
    })
  );
});

self.addEventListener('message', event => {
  if (event.data === 'GET_CACHE_VERSION') {
    event.source.postMessage({ cacheVersion: CACHE_VERSION });
  } else if (event.data && event.data.type === 'GET_CACHE_VERSION') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ cacheVersion: CACHE_VERSION });
    }
  } else if (event.data && event.data.type === 'REGISTER_SYNC') {
    if (self.registration.sync) {
      self.registration.sync.register(event.data.tag);
    }
  }
});

self.addEventListener('push', event => {
  const ICON = `${BASE_PATH}img/music_icon_192.png`;
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

  const urlToOpen = event.notification.data?.url || BASE_PATH;
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

self.addEventListener('sync', event => {
  if (event.tag === 'sync-library') {
    event.waitUntil(syncLibraryData());
  }
});

async function syncLibraryData() {
  try {
    const pendingData = await getPendingSyncData('library');
    if (!pendingData) return;

    await new Promise(resolve => setTimeout(resolve, 1000));
    clearSyncData('library');

    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_COMPLETE', data: pendingData });
    });
  } catch (error) {
    console.error('Error en sync:', error);
    throw error;
  }
}

async function getPendingSyncData(tag) {
  const cache = await caches.open(DATA_CACHE_NAME);
  const response = await cache.match(`/pending-sync-${tag}`);
  return response ? response.json() : null;
}

function clearSyncData(tag) {
  caches.open(DATA_CACHE_NAME).then(cache => cache.delete(`/pending-sync-${tag}`));
}
