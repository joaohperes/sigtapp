// SW "suicida" — o app NÃO usa mais PWA. Navegadores que instalaram o service
// worker antigo (era um Workbox que servia bundle JS desatualizado após deploy)
// checam periodicamente este /sw.js por uma atualização. Ao receber este SW, ele:
//   1. assume controle imediatamente (skipWaiting + clients.claim)
//   2. apaga todos os caches do CacheStorage
//   3. desregistra a si mesmo
//   4. recarrega todas as abas abertas, que passam a buscar tudo da rede
// Resultado: o SW fantasma se mata sozinho na próxima visita, sem ação do usuário.
// NÃO remover este arquivo enquanto houver clientes com o SW antigo instalado.

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Limpa todo o CacheStorage
    const keys = await caches.keys()
    await Promise.all(keys.map((k) => caches.delete(k)))
    // Assume controle das abas já abertas
    await self.clients.claim()
    // Desregistra este SW
    await self.registration.unregister()
    // Força reload das abas para que carreguem o bundle novo direto da rede
    const clients = await self.clients.matchAll({ type: 'window' })
    clients.forEach((client) => client.navigate(client.url))
  })())
})

// Enquanto este SW estiver ativo, nunca responde do cache — sempre rede.
self.addEventListener('fetch', () => { /* no-op: deixa passar para a rede */ })
