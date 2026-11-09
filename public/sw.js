// CipherNote Service Worker - Robust Offline-Ready PWA Worker
const CACHE_NAME = 'ciphernote-v7-stable';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('SW Precache warning:', err);
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  // Purge any older caches to ensure clean state
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
            return null;
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Network-First with guaranteed Cache fallback for offline start_url validation
self.addEventListener('fetch', (event) => {
  // Only process standard GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignore chrome-extension or external analytics if any
  if (url.origin !== self.location.origin) return;

  // Navigation requests (HTML document loads)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline fallback: serve precached index
          const cached = await caches.match(event.request);
          if (cached) return cached;
          const cachedRoot = await caches.match('/');
          if (cachedRoot) return cachedRoot;
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Assets (JS, CSS, images, icons, fonts)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      // Return cached asset immediately if available, while refreshing cache in background
      return cachedResponse || fetchPromise;
    })
  );
});
