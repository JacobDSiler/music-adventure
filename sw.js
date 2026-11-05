/* Music Adventure service worker: the whole app works offline. Other origins (Firebase, fonts) are never intercepted. */
const CACHE = "mu-shell-v2";
const SHELL = ["./", "index.html", "mu-audio.js", "mu-core.js", "mu-ui.js", "mu-data.js", "mu-content.js", "mu-labs-a.js", "mu-labs-b.js", "mu-labs-c.js", "mu-studio.js", "mu-intervals.js", "mu-games.js", "mu-shelf.js", "mu-parent.js", "manifest.json", "icon.svg", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => {
    const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r;
  }).catch(() => caches.match(e.request).then(r => r || caches.match("index.html"))));
});
