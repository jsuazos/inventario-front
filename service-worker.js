const CACHE_VERSION = 'v1.2.4'; // Aumenta esto cada vez que hagas cambios
const CACHE_NAME = `musica-inventario-${CACHE_VERSION}`;
const BASE_PATH = '/inventario-front/';
const urlsToCache = [
  `${BASE_PATH}`,
  `${BASE_PATH}src/aplicarColoresPorGenero.js`,
  `${BASE_PATH}src/clearFilters.js`,
  `${BASE_PATH}src/clearLibrary.js`,
  `${BASE_PATH}src/displayLibrary.js`,
  `${BASE_PATH}src/fetchArtistBanner.js`,
  `${BASE_PATH}src/fetchArtistDetails.js`,
  `${BASE_PATH}src/fetchArtistMBID.js`,
  `${BASE_PATH}src/fillSelect.js`,
  `${BASE_PATH}src/filterLibrary.js`,
  `${BASE_PATH}src/hexToRgba.js`,
  `${BASE_PATH}src/loadAlphabet.js`,
  `${BASE_PATH}src/loadLibrary.js`,
  `${BASE_PATH}src/main.js`,
  `${BASE_PATH}src/obtenerColorPorGenero.js`,
  `${BASE_PATH}src/obtenerConfiguracionActiva.js`,
  `${BASE_PATH}src/obtenerGeneros.js`,
  `${BASE_PATH}src/obtenerTopEstilos.js`,
  `${BASE_PATH}src/populateFilters.js`,
  `${BASE_PATH}src/style.css`,
  `${BASE_PATH}src/toggleLoader.js`,
  `${BASE_PATH}src/toggleSidebar.js`,

  `${BASE_PATH}index.html`,  
  `${BASE_PATH}manifest.json`,
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
