/* ---------- Virus Bus — Service Worker (PWA) ---------- */
// Stratégie :
//   - Shell statique (HTML, CSS, JS) : Stale-While-Revalidate (rapide + auto-maj)
//   - Assets (images, audio MP3, fonts) : Cache-First (long TTL, audio lourd)
//   - Autres (CDN, API) : Network-First fallback cache
const VERSION = 'vb-1';
const SHELL = `virusbus-shell-${VERSION}`;
const ASSETS = `virusbus-assets-${VERSION}`;

const SHELL_URLS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/ambient.js',
  '/js/enhance.js',
  '/js/enhance2.js',
  '/js/vortex.js',
  '/js/reader.js',
  '/js/lightbox.js',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    await cache.addAll(SHELL_URLS.map((u) => new Request(u, { cache: 'reload' })));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Purge des anciennes versions
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((k) => !k.endsWith(VERSION))
      .map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

function isAssetURL(url) {
  return /\.(png|jpe?g|webp|svg|gif|mp3|m4a|wav|vtt|woff2?|ttf)$/i.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;  // laisse passer CDN

  // Cache-first pour les assets lourds (images, audio)
  if (isAssetURL(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(ASSETS);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const resp = await fetch(req);
        if (resp.ok) cache.put(req, resp.clone());
        return resp;
      } catch (e) {
        return cached || Response.error();
      }
    })());
    return;
  }

  // Stale-while-revalidate pour le shell
  event.respondWith((async () => {
    const cache = await caches.open(SHELL);
    const cached = await cache.match(req);
    const fetchPromise = fetch(req).then((resp) => {
      if (resp.ok) cache.put(req, resp.clone());
      return resp;
    }).catch(() => cached);
    return cached || fetchPromise;
  })());
});
