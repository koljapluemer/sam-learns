// Offline, apps that load one asset per exercise (audio clip, image, model)
// only pick items whose asset is cached. `isUrlAvailable` is synchronous so
// pickers can filter with it directly; await `cachedUrlsReady()` once before
// the first pick.
import { ref, watch } from 'vue'
import { isOnline } from './useOnline'
import { hasServiceWorker } from './serviceWorker'

const APP_CACHE_PREFIX = 'app-'

// null = no filtering (online, or no service worker to serve a cache).
const cachedUrls = ref<Set<string> | null>(null)
let loading: Promise<void> = Promise.resolve()

async function loadCachedUrls(): Promise<Set<string>> {
  const names = (await caches.keys()).filter((name) => name.startsWith(APP_CACHE_PREFIX))
  const requests = await Promise.all(names.map(async (name) => (await caches.open(name)).keys()))
  return new Set(requests.flat().map((request) => request.url))
}

watch(
  isOnline,
  (online) => {
    if (online || !hasServiceWorker()) {
      cachedUrls.value = null
      return
    }
    loading = loadCachedUrls().then((urls) => {
      cachedUrls.value = urls
    })
  },
  { immediate: true }
)

export function cachedUrlsReady(): Promise<void> {
  return loading
}

export function isUrlAvailable(url: string): boolean {
  return cachedUrls.value === null || cachedUrls.value.has(new URL(url, location.origin).href)
}

export const NOTHING_CACHED_MESSAGE = 'Nothing cached for offline use yet. Practice once while online.'
