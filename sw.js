const CACHE='calistenia-militar-final-v7';
const ASSETS=['./','./index.html','./manifest.webmanifest','./flexiones-de-pecho.jpg','./sentadillas.jpg','./remo-invertido.jpg','./fondos-en-silla.jpg','./plancha.jpg','./superman.jpg','./mountain-climbers.jpg','./burpees.jpg','./plancha-lateral.jpg','./abdominal-bicicleta.jpg','./referencia-general.jpg'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const marker = '/assets/exercises/';

  // Compatibility fix: older app builds requested exercise images from
  // /assets/exercises/, while the GitHub repository stores the original
  // PDF-derived images at the site root. Serve the real file transparently.
  if (url.pathname.includes(marker)) {
    const filename = url.pathname.split(marker).pop();
    const fixed = new URL(url.href);
    fixed.pathname = url.pathname.substring(0, url.pathname.indexOf(marker)) + '/' + filename;
    event.respondWith(
      fetch(fixed.toString())
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(fixed.toString()).then(r => r || caches.match(event.request)))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then(r => r || caches.match('./index.html')))
  );
});
