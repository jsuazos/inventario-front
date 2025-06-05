const CACHE_VERSION = 'v1.0'; // Aumenta esto cada vez que hagas cambios
const CACHE_NAME = `musica-inventario-${CACHE_VERSION}`;
const BASE_PATH = '/inventario-front/';
const urlsToCache = [
  `${BASE_PATH}`,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}src/main.js`,
  `${BASE_PATH}src/loadLibrary.js`,
  `${BASE_PATH}src/filterLibrary.js`,
  `${BASE_PATH}src/displayLibrary.js`,
  `${BASE_PATH}src/aplicarColoresPorGenero.js`,
  `${BASE_PATH}src/obtenerTopEstilos.js`,
  `${BASE_PATH}src/populateFilters.js`,
  `${BASE_PATH}src/toggleLoader.js`,
  `${BASE_PATH}src/mostrarBannerArtista.js`,
  `${BASE_PATH}src/mostrarDiscoModal.js`,
  `${BASE_PATH}manifest.json`,
  `${BASE_PATH}music_icon_192.png`,
  `${BASE_PATH}music_icon_512.png`,
  `${BASE_PATH}music_library_icon.ico`
];

// self.addEventListener('install', event => {
//   self.skipWaiting(); // Activa inmediatamente
//   try {
//     event.waitUntil(
//       caches.open(CACHE_NAME).then(cache => {
//         return cache.addAll(urlsToCache);
//       })
//     );
//   } catch (e) {
//     console.error('Error al cachear recursos:', e);
//   }
// });

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
