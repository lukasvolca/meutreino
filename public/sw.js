// v2: páginas vêm sempre da rede (dados frescos); o cache só é usado
// como reserva quando não há conexão. Arquivos estáticos com hash ficam em cache.
const CACHE = 'meutreino-v3'
const PRECACHE = ['/manifest.json', '/icon-192.png', '/icon-512.png', '/icon.svg', '/apple-touch-icon.png']

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const { request } = e
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Arquivos de build têm hash no nome: cache-first é seguro.
  if (url.pathname.startsWith('/_next/static/') || PRECACHE.includes(url.pathname)) {
    e.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(request, clone))
        }
        return res
      }))
    )
    return
  }

  // Navegação (abrir/recarregar uma página): rede primeiro; sem conexão,
  // usa a última versão salva para o app não ficar em branco na academia.
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).then(res => {
        if (res.ok && !res.redirected) {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(request, clone))
        }
        return res
      }).catch(() => caches.match(request).then(cached => cached || Response.error()))
    )
  }
  // Demais requisições (RSC, APIs): direto pela rede, sem cache.
})
