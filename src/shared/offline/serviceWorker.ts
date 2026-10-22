import { registerSW } from 'virtual:pwa-register'

const supported = import.meta.env.PROD && 'serviceWorker' in navigator

export function hasServiceWorker(): boolean {
  return supported && navigator.serviceWorker.controller !== null
}

// Resolves once a service worker controls this page (never in dev).
export function controllingServiceWorker(): Promise<ServiceWorker> {
  return new Promise((resolve) => {
    if (!supported) return
    const { serviceWorker } = navigator
    if (serviceWorker.controller) return resolve(serviceWorker.controller)
    serviceWorker.addEventListener('controllerchange', () => serviceWorker.controller && resolve(serviceWorker.controller), {
      once: true
    })
  })
}

// Code and data fetched before the worker took over (first visit) never went
// through it - hand those URLs over so it caches them too.
function cacheEarlyResources(worker: ServiceWorker): void {
  const urlsToCache = performance
    .getEntriesByType('resource')
    .map((entry) => new URL(entry.name))
    .filter((url) => url.origin === location.origin && /^\/(assets|data)\//.test(url.pathname))
    .map((url) => url.href)
  worker.postMessage({ type: 'CACHE_URLS', payload: { urlsToCache } })
}

export function registerServiceWorker(): void {
  if (!supported) return
  const hadController = navigator.serviceWorker.controller !== null
  registerSW({ immediate: true })
  if (!hadController) void controllingServiceWorker().then(cacheEarlyResources)
}
