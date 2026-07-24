<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { BarChart3, Home, Info, Settings, X } from 'lucide-vue-next'
import { apps, type AppRouteDefinition } from '@/appRegistry'
import { DEFAULT_SHELL_STATE, shellState } from '@/shared/shell/shellState'
import { routeNameForPath, isDynamicRoutePath } from '@/shared/shell/appRoutePath'

const route = useRoute()

const isFooterExpanded = ref(true)

const appSlug = computed(() => (typeof route.meta.appSlug === 'string' ? route.meta.appSlug : ''))
const app = computed(() => apps.find((candidate) => candidate.slug === appSlug.value))

const appName = computed(() => (shellState.title !== DEFAULT_SHELL_STATE.title ? shellState.title : ''))

const mainClass = computed(() =>
  route.meta.layout === 'full-bleed'
    ? 'w-full min-h-screen'
    : 'flex w-full min-h-screen justify-center bg-base-200/40 px-4 pb-8 pt-20'
)

type NavTab = { routeName: string; label: string; icon?: typeof Home }

const tabs = computed<NavTab[]>(() => {
  if (!app.value) {
    return [
      { routeName: 'stats', label: 'Stats', icon: BarChart3 },
      { routeName: 'settings', label: 'Settings', icon: Settings }
    ]
  }

  const slug = app.value.slug
  const staticRoutes = app.value.routes.filter((r) => !isDynamicRoutePath(r.path))
  const byPath = (path: string) => staticRoutes.find((r) => r.path === path)
  const rest = staticRoutes.filter((r) => r.path !== '' && r.path !== 'stats' && r.path !== 'settings')

  const ordered = [byPath(''), byPath('stats'), byPath('settings'), ...rest].filter(
    (r): r is AppRouteDefinition => r !== undefined
  )

  return ordered.map((r) => ({
    routeName: routeNameForPath(slug, r.path),
    label: r.label ?? (r.path === '' ? 'Home' : r.path.charAt(0).toUpperCase() + r.path.slice(1)),
    icon: r.path === '' ? Home : r.path === 'stats' ? BarChart3 : r.path === 'settings' ? Settings : undefined
  }))
})
</script>

<template>
  <div class="min-h-screen w-full text-base-content">
    <div class="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-start justify-between gap-2 p-3">
      <router-link :to="{ name: 'home' }"
        class="btn btn-ghost btn-sm pointer-events-auto gap-2 border border-base-300 bg-base-100/90 shadow-sm backdrop-blur"
        aria-label="Sam Learns Things home">
        <Home :size="18" aria-hidden="true" />
        <span class="hidden sm:inline">Sam Learns<template v-if="appName"> | {{ appName }}</template></span>
      </router-link>

      <nav
        class="pointer-events-auto flex max-w-[70vw] flex-wrap items-center justify-end gap-1 rounded-box border border-base-300 bg-base-100/90 p-1 shadow-sm backdrop-blur">
        <router-link v-for="tab in tabs" :key="tab.routeName" :to="{ name: tab.routeName }"
          class="btn btn-ghost btn-sm gap-2" :class="{ 'btn-active': route.name === tab.routeName }">
          <component :is="tab.icon" v-if="tab.icon" :size="18" aria-hidden="true" />
          <span class="hidden sm:inline">{{ tab.label }}</span>
        </router-link>
      </nav>
    </div>

    <main :class="mainClass">
      <RouterView />
    </main>

    <footer class="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex items-center justify-start p-3 w-full">
      <div v-if="isFooterExpanded"
        class="pointer-events-auto relative rounded-box border border-base-300 bg-base-100/90 p-2 pr-8 shadow-sm backdrop-blur text-xs gap-2 flex flex-col">
        <p>
          Made with ♥ by <a href="https://koljasam.com" target="_blank" rel="noopener noreferrer" class="link">Kolja
            Sam</a>.
        </p>
        <p>
          If you want to support me building more apps like this in the future,
          <a href="https://ko-fi.com/S6S81CWUVD" target="_blank" rel="noopener" class="link">
            support my work on ko-fi
          </a>.
        </p>

        <p>
          I'm using the privacy-friendly <a href="https://www.goatcounter.com" target="_blank" rel="noopener noreferrer"
            class="link">Goatcounter</a> to track page views and I store some pseudonymous learning data. No
          personal data is collected, and cookies are used solely for tracking your learning progress on your
          device. This app is
          <a href="https://github.com/koljapluemer/sam-learns-things" target="_blank" rel="noopener noreferrer"
            class="link">open source</a>.
        </p>
        <p v-if="app?.credits" v-html="app.credits"></p>
        <p>
          <button type="button" @click="isFooterExpanded = false" class="btn btn-xs" aria-label="Hide footer">
            <span class="">Hide</span>
            <X :size="14" aria-hidden="true" />
          </button>
        </p>
      </div>

      <div v-else
        class="pointer-events-auto flex items-center justify-end gap-1 rounded-box border border-base-300 bg-base-100/90 p-1 shadow-sm backdrop-blur"">
      
      <button  @click=" isFooterExpanded = true" aria-label="Show footer" type="button" class="btn btn-sm">

        <Info class="" :size="18" aria-hidden="true" />

        </button>
        <a class="btn btn-sm" href="https://ko-fi.com/S6S81CWUVD" target="_blank" rel="noopener">
          Support My Work (ko-fi)
        </a>

      </div>

    </footer>

  </div>
</template>
