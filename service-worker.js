
const CACHE_NAME = 'crossfit-timer-v5';
const urlsToCache = [
  '/CrossFit-timer/',
  '/CrossFit-timer/index.html',
  '/CrossFit-timer/styles.css?v=2.0',
  '/CrossFit-timer/app.js?v=2.0',
  '/CrossFit-timer/manifest.json',
  '/CrossFit-timer/icon-192.png',
  '/CrossFit-timer/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
