const CACHE_NAME = 'musica-inventario-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/src/style.css',
    '/manifest.json',
    '/music_icon_192.png',
    '/music_icon_512.png',
    "/music_library_icon.ico"
];


self.addEventListener('install', event => {
  self.skipWaiting(); // Activa inmediatamente
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
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
