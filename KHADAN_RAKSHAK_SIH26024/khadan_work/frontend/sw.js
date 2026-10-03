/* App-shell cache. API requests are intentionally never cached. */
const CACHE_NAME = 'khadan-rakshak-shell-v3';
const SHELL = [
  './', './index.html', './styles.css', './app.js', './phase3.js',
  './live-integration.js', './offline-queue.js', './manifest.json',
  './icons/icon-192.svg', './icons/icon-512.svg'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET') return;
  // Cache external UI libraries after the first successful online load, for offline shell rendering.
  const cdnHosts = ['cdn.tailwindcss.com', 'cdnjs.cloudflare.com', 'cdn.jsdelivr.net'];
  if (url.origin !== self.location.origin) {
    if (!cdnHosts.includes(url.hostname)) return;
    event.respondWith(caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(request);
      if (cached) return cached;
      try { const response = await fetch(request); if (response && (response.ok || response.type === 'opaque')) await cache.put(request, response.clone()); return response; }
      catch (error) { return cached || Response.error(); }
    }));
    return;
  }
  if (url.pathname.includes('/api/') || url.pathname.includes('/ws/')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy)); return response;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(request, copy)); }
    return response;
  })));
});
