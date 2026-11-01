// Increment together with core.js and the module/stylesheet URLs in index.html.
const RELEASE = '2026.4';
const CACHE = `christmas-shell-${RELEASE}`;
const FILES = ['index.html', 'style.css', 'app.js', 'core.js', 'audio.js', 'content.json', 'icon.svg', 'icon-192.png', 'icon-512.png', 'puzzle.svg', 'manifest.webmanifest', 'games/index.js', 'games/engine.js', 'games/adventures.js', 'games/arcade.js', 'games/workshop.js', 'games/workshop-art.js'];
const versioned = path => /\.(?:js|css|json)$/.test(path) ? `${path}?v=${RELEASE}` : path;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => Promise.all(
    FILES.filter(path => !path.startsWith('games/')).map(async path => {
      const url = versioned(path);
      const response = await fetch(url, { cache: 'reload' });
      if (!response.ok) throw Error(`Unable to cache ${path}: HTTP ${response.status}`);
      await cache.put(url, response);
    })
  )));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('christmas-shell-') && key !== CACHE).map(key => caches.delete(key))
  )));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const base = new URL('./', self.location.href);
  if (event.request.method !== 'GET' || url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return;
  const relative = url.pathname.slice(base.pathname.length);
  const navigation = (relative === '' || relative === 'index.html') && event.request.mode === 'navigate';
  if (!navigation && !FILES.includes(relative)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    let response;
    try {
      // Do not let the browser's HTTP cache reintroduce an older release.
      response = await fetch(event.request, { cache: 'no-store' });
    } catch {
      const stored = await cache.match(event.request);
      return stored || (navigation ? await cache.match('index.html') : null) || Response.error();
    }
    if (response.ok) {
      // Await writes so a worker shutdown cannot drop an offline game module.
      try { await cache.put(event.request, response.clone()); } catch { /* Full storage must not block an online response. */ }
    }
    return response;
  })());
});
