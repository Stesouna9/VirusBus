/* ---------- Virus Bus — Service Worker KILLSWITCH ---------- */
// Previous SW (vb-1, vb-2) cached HTML with broken CSP (upgrade-insecure-requests
// while TLS cert not provisioned). This SW unregisters itself + nukes all caches
// + force-reloads open clients. After this version propagates, users get clean
// state. PWA can be re-introduced later in a fresh SW.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // 1. Wipe every cache
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    // 2. Unregister self
    await self.registration.unregister();
    // 3. Reload all controlled clients
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((c) => c.navigate(c.url));
  })());
});

// Pass-through for any in-flight requests during activation
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
