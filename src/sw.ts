// Service worker. Precaches only the shell (index.html + icons); everything
// else is cached when first used:
// - /assets/* (hashed code chunks) -> one shared `code` cache
// - /data/*   (app content)        -> one `app-<slug>` cache per micro-app,
//   attributed to the app whose page requested it.
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, createHandlerBoundToURL, matchPrecache, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst, StaleWhileRevalidate, type Strategy } from 'workbox-strategies'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { createPartialResponse } from 'workbox-range-requests'

declare let self: ServiceWorkerGlobalScope

const CODE_CACHE = 'code'
const APP_CACHE_PREFIX = 'app-'
const CATALOG_EXTENSIONS = /\.(json|jsonl|csv)$/i

self.skipWaiting()
clientsClaim()
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html'), { denylist: [/^\/data\//] }))

const okOnly = () => [new CacheableResponsePlugin({ statuses: [200] })]
// Servers may send `Vary: Origin`; module scripts carry an Origin header,
// cached copies don't. Same static file either way.
const matchOptions = { ignoreVary: true }

registerRoute(
  ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/assets/'),
  new CacheFirst({ cacheName: CODE_CACHE, plugins: okOnly(), matchOptions })
)

// The shell's own chunks (entry, CSS, modulepreloads) are referenced from
// index.html - cache them up front so the app always boots offline.
self.addEventListener('activate', (event) => {
  event.waitUntil(cacheShellAssets())
})

async function cacheShellAssets(): Promise<void> {
  const html = await (await matchPrecache('index.html'))?.text()
  if (!html) return
  const urls = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1])
  const cache = await caches.open(CODE_CACHE)
  const missing = await Promise.all(urls.map(async (url) => ((await cache.match(url, matchOptions)) ? null : url)))
  await cache.addAll(missing.filter((url): url is string => url !== null))
}

const strategies = new Map<string, Strategy>()

function strategyFor(cacheName: string, catalog: boolean): Strategy {
  const key = `${cacheName}:${catalog}`
  let strategy = strategies.get(key)
  if (!strategy) {
    strategy = catalog
      ? new StaleWhileRevalidate({ cacheName, plugins: okOnly(), matchOptions })
      : new CacheFirst({ cacheName, plugins: okOnly(), matchOptions })
    strategies.set(key, strategy)
  }
  return strategy
}

// Fetches come with a clientId; CACHE_URLS messages (see
// registerServiceWorker.ts) with the posting window as `source`.
async function requestingAppSlug(event: ExtendableEvent | undefined): Promise<string> {
  let clientUrl: string | undefined
  if (event instanceof FetchEvent) {
    clientUrl = (await self.clients.get(event.clientId))?.url
  } else if (event instanceof ExtendableMessageEvent && event.source instanceof Client) {
    clientUrl = event.source.url
  }
  const slug = clientUrl ? new URL(clientUrl).pathname.split('/')[1] : ''
  return slug || 'shared'
}

registerRoute(
  ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/data/'),
  async ({ request, event }) => {
    const cacheName = APP_CACHE_PREFIX + (await requestingAppSlug(event))
    const catalog = CATALOG_EXTENSIONS.test(new URL(request.url).pathname)
    // Media elements send Range requests; always cache the full file and
    // slice the requested range out of it.
    const full = await strategyFor(cacheName, catalog).handle({ request: new Request(request.url), event })
    return request.headers.has('range') ? createPartialResponse(request, full) : full
  }
)
