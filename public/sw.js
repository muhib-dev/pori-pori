// Offline-first service worker. Pages: network-first with cache fallback.
// Static assets (/_next/static, fonts, icons, audio): cache-first.
const VERSION = "rf-v7";
const SHELL = [
  "/",
  "/level/",
  "/play/",
  "/grownups/",
  "/stickers/",
  "/challenge/",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(VERSION)
      .then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) =>
        Promise.all(
          ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Network-first for pages and Next chunks (dev chunks have unhashed names, so cache-first served stale code).
  if (req.mode === "navigate" || url.pathname.startsWith("/_next/")) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(url.pathname, copy));
          return res;
        })
        .catch(() =>
          caches
            .match(url.pathname, { ignoreSearch: true })
            .then(
              (r) =>
                r ||
                (req.mode === "navigate" ? caches.match("/") : Response.error()),
            ),
        ),
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
