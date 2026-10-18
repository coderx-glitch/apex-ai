// APEX app shell cache. Static files only - API calls are never cached.
const SHELL = 'apex-shell-v1';
const CORE = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== SHELL).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return; // AI and account calls always go to the network

  // Pages: try the network first so updates land, fall back to the cached
  // shell when the phone is offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const copy = res.clone();
          caches.open(SHELL).then(c => c.put('/', copy));
          return res;
        })
        .catch(() => caches.match('/') )
    );
    return;
  }

  // Hashed build assets are immutable: serve from cache, fill on first use.
  // A failed fetch must become a real error response - letting respondWith
  // reject can leave the browser's module loader hanging instead of failing.
  event.respondWith(
    caches.match(event.request).then(hit => hit || fetch(event.request).then(res => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(SHELL).then(c => c.put(event.request, copy));
      }
      return res;
    }).catch(() => new Response('APEX could not reach the network. Check your connection and retry.', {
      status: 503,
      headers: {'Content-Type': 'text/plain'}
    })))
  );
});
