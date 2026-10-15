const CACHE_NAME = 'preach-mate-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './firebase-auth.js',
  './cloud-sync.js',
  './logo.png',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install Event: Caches critical files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event: Cleans up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch Event: Network-first strategy for dynamic config files & index.html
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Laging kumuha muna sa network/server para sa version.json at index.html
  if (url.pathname.endsWith('/version.json') || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-first for all other assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
