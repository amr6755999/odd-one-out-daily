/* Tiny dependency-free service worker: app shell first, then cache local assets. */
const CACHE_NAME = 'odd-one-out-daily-v1';
const ROOT_URL = new URL('./', self.registration.scope);
const SHELL_URLS = [new URL('./', ROOT_URL).href, new URL('./index.html', ROOT_URL).href,
  new URL('./manifest.webmanifest', ROOT_URL).href, new URL('./icon.svg', ROOT_URL).href, new URL('./icon-192.png', ROOT_URL).href,
  new URL('./icon-512.png', ROOT_URL).href, new URL('./apple-touch-icon.png', ROOT_URL).href];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(SHELL_URLS);
    // Vite emits fingerprinted JS/CSS filenames. Precache those bundle URLs
    // from the built HTML so the first installed load can launch offline too.
    const indexUrl = new URL('./index.html', ROOT_URL);
    const indexResponse = await cache.match(indexUrl.href);
    if (indexResponse) {
      const html = await indexResponse.text();
      const bundlePaths = [...html.matchAll(/(?:src|href)=[\"']([^\"']+\.(?:js|css)(?:\?[^\"']*)?)[\"']/g)]
        .map((match) => new URL(match[1], indexUrl).href)
        .filter((url) => new URL(url).origin === self.location.origin);
      await Promise.all(bundlePaths.map(async (url) => {
        try { await cache.add(url); } catch { /* Non-critical optional bundle. */ }
      }));
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith('odd-one-out-daily-') && name !== CACHE_NAME).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(new URL('./index.html', ROOT_URL).href, response.clone());
        }
        return response;
      } catch {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(new URL('./index.html', ROOT_URL).href)) || (await cache.match(new URL('./', ROOT_URL).href));
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok && response.type === 'basic') await cache.put(event.request, response.clone());
      return response;
    } catch (error) {
      throw error;
    }
  })());
});
