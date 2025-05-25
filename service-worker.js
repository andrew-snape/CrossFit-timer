// Service Worker for CrossFit Timer
const CACHE_NAME = 'crossfit-timer-v2';
const urlsToCache = [
  '/CrossFit-timer/',
  '/CrossFit-timer/index.html',
  '/CrossFit-timer/styles.css',
  '/CrossFit-timer/app.js',
  '/CrossFit-timer/icon-192.png',
  '/CrossFit-timer/icon-512.png',
  '/CrossFit-timer/manifest.json'
];
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    }).catch(() => {
      return undefined;
    })
  );
});
