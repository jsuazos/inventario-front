const CACHE_VERSION = 'v1.4.2'; // Aumenta esto cada vez que hagas cambios
const CACHE_NAME = `musica-inventario-${CACHE_VERSION}`;

// Detectar entorno basado en la URL
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
  console.log(`🚀 Instalando Service Worker ${CACHE_VERSION} (Entorno: ${isDevelopment ? 'desarrollo' : 'producción'})`);
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      console.log(`📦 Cacheando ${urlsToCache.length} archivos...`);

      // En desarrollo, reducir la cantidad de archivos a cachear inicialmente
      const filesToCache = isDevelopment ? urlsToCache.slice(0, 10) : urlsToCache;

      // Procesar archivos en lotes con delay para evitar rate limiting
      const batchSize = 3;
      for (let i = 0; i < filesToCache.length; i += batchSize) {
        const batch = filesToCache.slice(i, i + batchSize);

        await Promise.all(batch.map(async url => {
          try {
            console.log(`📄 Intentando cachear: ${url}`);
            const response = await fetch(url, {
              cache: 'no-cache' // Evitar cache del navegador
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            await cache.put(url, response.clone());
            console.log(`✅ Cacheado exitosamente: ${url}`);
            return { url, success: true };
          } catch (err) {
            console.warn(`⚠️ Error al cachear ${url}:`, err.message);
            return { url, success: false, error: err.message };
          }
        }));

        // Pequeño delay entre lotes para evitar rate limiting
        if (i + batchSize < filesToCache.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`📊 Caching completado para ${isDevelopment ? 'desarrollo' : 'producción'}`);
    })
    .catch(error => {
      console.error('❌ Error crítico al abrir cache:', error);
    })
  );
});


self.addEventListener('message', event => {
  if (event.data && event.data.type === 'GET_CACHE_VERSION') {
    event.ports[0].postMessage({ cacheVersion: CACHE_VERSION });
  }
});


self.addEventListener('activate', event => {
  // Limpia versiones antiguas de caché
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    )
  );
  self.clients.claim(); // Toma control inmediato
});

self.addEventListener('fetch', event => {
  // Solo interceptar requests del mismo origen para evitar problemas con CORS
  if (!event.request.url.startsWith(self.location.origin)) {
    // Para imágenes externas (Discogs, MusicBrainz, etc.), aplicar rate limiting
    if (event.request.url.includes('i.discogs.com') ||
        event.request.url.includes('img.discogs.com') ||
        event.request.url.includes('musicbrainz.org') ||
        event.request.url.includes('fanart.tv')) {

      event.respondWith(
        caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }

            // Intentar fetch con timeout y reintento limitado
            return fetch(event.request, {
              signal: AbortSignal.timeout(5000) // 5 segundos timeout
            })
              .then(networkResponse => {
                // Solo cachear si la respuesta es exitosa y no es 429
                if (networkResponse.ok && networkResponse.status !== 429) {
                  const responseClone = networkResponse.clone();
                  caches.open(CACHE_NAME)
                    .then(cache => cache.put(event.request, responseClone))
                    .catch(err => console.warn('Error cacheando imagen externa:', err));
                }
                return networkResponse;
              })
              .catch(error => {
                console.warn(`Error fetching imagen externa ${event.request.url}:`, error.message);
                // Devolver una respuesta de fallback en lugar de error
                return new Response('', {
                  status: 503,
                  statusText: 'Image temporarily unavailable'
                });
              });
          })
          .catch(error => {
            console.error('Error en cache.match para imagen externa:', error);
            return fetch(event.request, {
              signal: AbortSignal.timeout(3000)
            }).catch(fetchError => {
              console.error('Error en fallback fetch para imagen externa:', fetchError);
              return new Response('', {
                status: 503,
                statusText: 'Image service unavailable'
              });
            });
          })
      );
      return;
    }

    // Para otras URLs externas, dejar que el navegador las maneje normalmente
    return;
  }

  // Para requests del mismo origen, usar cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request)
          .then(networkResponse => {
            // Cachear respuestas exitosas del mismo origen
            if (networkResponse.ok) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, responseClone))
                .catch(err => console.warn('Error cacheando respuesta:', err));
            }
            return networkResponse;
          })
          .catch(error => {
            console.warn(`Error fetching ${event.request.url}:`, error.message);
            // Para requests de navegación, devolver la página principal
            if (event.request.mode === 'navigate') {
              return caches.match(`${BASE_PATH}index.html`);
            }
            return new Response('Network Error', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
      .catch(error => {
        console.error('Error en cache.match:', error);
        return fetch(event.request).catch(fetchError => {
          console.error('Error en fallback fetch:', fetchError);
          return new Response('Network Error', {
            status: 503,
            statusText: 'Network Error'
          });
        });
      })
  );
});

self.addEventListener('message', event => {
  if (event.data === 'GET_CACHE_VERSION') {
    event.source.postMessage({ cacheVersion: CACHE_VERSION });
  }
});
