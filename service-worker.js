const CACHE_VERSION = 'v1.2.5'; // Aumenta esto cada vez que hagas cambios
const CACHE_NAME = `musica-inventario-${CACHE_VERSION}`;
const BASE_PATH = '/inventario-front/';
const urlsToCache = [
  `${BASE_PATH}`,
  `${BASE_PATH}src/services/configService.js`,
  `${BASE_PATH}src/services/api.js`,
  `${BASE_PATH}src/services/libraryService.js`,
  `${BASE_PATH}src/services/artistService.js`,
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
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const url of urlsToCache) {
        try {
          console.log(`Intentando cachear: ${url}`);
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Status: ${response.status}`);
          await cache.put(url, response.clone());
          console.log(`✅ Cacheado: ${url}`);
        } catch (err) {
          console.error(`❌ Error al cachear ${url}:`, err);
        }
      }
    })
  );
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
  event.respondWith(
    caches.match(event.request).then(response =>
      response || fetch(event.request)
    )
  );
});

self.addEventListener('message', event => {
  if (event.data === 'GET_CACHE_VERSION') {
    event.source.postMessage({ cacheVersion: CACHE_VERSION });
  }
});
