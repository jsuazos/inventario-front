self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('inventario-cache').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/style.css',
        '/manifest.json',
        '/music_icon_192.png',
        '/music_icon_512.png',
        "/music_library_icon.ico"
      ]);
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});
