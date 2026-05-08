// Dehqon Service Worker — offline kesh
const CACHE = "dehqon-v2";
const STATIC = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/manifest.json",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // API chaqiruvlarini SW orqali o'tkazmaymiz — to'g'ridan-to'g'ri network
  if (url.pathname.startsWith("/api/")) return;

  // Statik fayllar — kesh first, yo'q bo'lsa network
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
