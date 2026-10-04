// Service worker MIMC : rend l'application installable et accélère les ressources fixes.
// Les données (Firestore, authentification) ne passent jamais par ce cache.
const STATIQUE = 'mimc-statique-v1'
const BIBLES = 'mimc-bibles-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((c) => c !== STATIQUE && c !== BIBLES).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  )
})

const coupleCache = (nom, req, rep) => caches.open(nom).then((c) => c.put(req, rep))

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return // Firebase, polices, etc. : réseau direct

  // Bibles intégrées : lourdes et immuables, gardées pour la lecture hors connexion
  if (url.pathname.startsWith('/bibles/')) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((rep) => { if (rep.ok) coupleCache(BIBLES, req, rep.clone()); return rep })))
    return
  }
  // Fichiers générés (nom contenant un code unique) : cache d'abord
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((rep) => { if (rep.ok) coupleCache(STATIQUE, req, rep.clone()); return rep })))
    return
  }
  // Pages : réseau d'abord (toujours la dernière version), copie de secours hors connexion
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((rep) => { if (rep.ok) coupleCache(STATIQUE, '/index.html', rep.clone()); return rep })
        .catch(() => caches.match('/index.html').then((hit) => hit || Response.error())),
    )
  }
})
