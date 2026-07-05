// Service worker mínimo — su único trabajo es cumplir el requisito técnico
// de Chrome/Android para poder instalar la app (necesita un service worker
// registrado con un manejador de "fetch"). No intenta ser un cache offline
// completo: los datos de la quiniela viven en Firestore y necesitan internet
// para estar al día, así que cachear agresivamente causaría más problemas
// (mostrar resultados viejos) de los que resuelve.
//
// Estrategia: "app shell" cacheado para que la app abra rápido y no quede en
// blanco si por un instante no hay señal — pero siempre intenta la red
// primero para no mostrar una versión vieja del código.
const CACHE_NAME = 'quiniela-familia-shell-v1';
const SHELL_FILES = ['/', '/index.html', '/style.css', '/app.js', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Solo nos metemos con GET del mismo origen (el shell de la app). Todo lo
  // demás (Firestore, openfootball, flagcdn, fuentes, API-Football, etc.)
  // pasa directo a la red, sin intervención del service worker.
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('/index.html')))
  );
});
