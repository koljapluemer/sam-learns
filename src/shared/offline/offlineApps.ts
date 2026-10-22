// Which apps work offline. Visiting an app online caches the code of all its
// routes (its data gets cached as it is used); it then counts as offline-ready
// for the current build. After a deploy, previously ready apps get their new
// code cached in the background.
import { shallowRef } from 'vue'
import type { RouteLocationNormalized, Router } from 'vue-router'
import { apps, type AppDefinition } from '@/appRegistry'
import { useLocalSetting } from '@/shared/settings/useLocalSetting'
import { isOnline } from './useOnline'
import { controllingServiceWorker } from './serviceWorker'

// The entry script's hashed URL changes with every deploy that changes code.
const BUILD_ID = document.querySelector<HTMLScriptElement>('script[type="module"][src]')?.src ?? ''

// slug -> build whose code is cached for that app
const cachedBuilds = useLocalSetting<Record<string, string>>('offline-apps', {})

// The route whose code failed to load while offline, if any.
export const failedOfflineRoute = shallowRef<RouteLocationNormalized | null>(null)

export function appForRoute(route: RouteLocationNormalized | null): AppDefinition | undefined {
  return apps.find((app) => app.slug === route?.meta.appSlug)
}

export function isAppAvailableOffline(app: AppDefinition): boolean {
  return !app.requiresNetwork && cachedBuilds.value[app.slug] === BUILD_ID
}

async function cacheAppCode(app: AppDefinition): Promise<void> {
  await controllingServiceWorker()
  await Promise.all(app.routes.map((route) => (route.component as () => Promise<unknown>)()))
  cachedBuilds.value = { ...cachedBuilds.value, [app.slug]: BUILD_ID }
}

export function trackOfflineApps(router: Router): void {
  router.afterEach((to) => {
    failedOfflineRoute.value = null
    const app = appForRoute(to)
    if (app && isOnline.value && !app.requiresNetwork && !isAppAvailableOffline(app)) void cacheAppCode(app)
  })

  router.onError((_error, to) => {
    if (!isOnline.value) failedOfflineRoute.value = to
  })

  if (!isOnline.value) return
  apps
    .filter((app) => cachedBuilds.value[app.slug] && !isAppAvailableOffline(app))
    .forEach((app) => void cacheAppCode(app))
}
