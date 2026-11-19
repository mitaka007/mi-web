// Nai Monitor — guarda la app en el móvil para que abra sin internet.
// Al publicar una versión nueva de la app, cambia el número de VERSION.
const VERSION = 'nai-monitor-v4.4';
const PROPIOS = ['./', './index.html', './manifest.webmanifest',
                 './icon-192.png', './icon-512.png', './icon-maskable-512.png'];
const LIBRERIAS = ['https://cdn.jsdelivr.net/npm/chart.js@4',
                   'https://cdn.jsdelivr.net/npm/hammerjs@2.0.8',
                   'https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@2'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(async c => {
    await c.addAll(PROPIOS);
    await Promise.all(LIBRERIAS.map(u => c.add(u).catch(() => {})));   // si alguna falla, se instala igual
  }).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const esPagina = req.mode === 'navigate' || req.url.endsWith('index.html');
  if (esPagina) {
    // La página: primero internet (para recibir versiones nuevas); sin conexión, la copia guardada.
    e.respondWith(fetch(req).then(r => {
      const copia = r.clone(); caches.open(VERSION).then(c => c.put(req, copia)); return r;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
    return;
  }
  // Lo demás (iconos, librerías): primero la copia guardada.
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(resp => {
    const copia = resp.clone(); caches.open(VERSION).then(c => c.put(req, copia)); return resp;
  })));
});
