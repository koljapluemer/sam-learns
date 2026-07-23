<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { BarChart3, Home, Settings } from 'lucide-vue-next'
import { apps, type AppRouteDefinition } from '@/appRegistry'
import { DEFAULT_SHELL_STATE, shellState } from '@/shared/shell/shellState'
import { routeNameForPath, isDynamicRoutePath } from '@/shared/shell/appRoutePath'

const route = useRoute()

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
  <div class="min-h-screen w-full bg-base-100 text-base-content">
    <div class="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-start justify-between gap-2 p-3">
      <router-link
        :to="{ name: 'home' }"
        class="btn btn-ghost btn-sm pointer-events-auto gap-2 border border-base-300 bg-base-100/90 shadow-sm backdrop-blur"
        aria-label="Sam Learns Things home"
      >
        <Home
          :size="18"
          aria-hidden="true"
        />
        <span class="hidden sm:inline">Sam Learns<template v-if="appName"> | {{ appName }}</template></span>
      </router-link>

      <nav class="pointer-events-auto flex max-w-[70vw] flex-wrap items-center justify-end gap-1 rounded-box border border-base-300 bg-base-100/90 p-1 shadow-sm backdrop-blur">
        <router-link
          v-for="tab in tabs"
          :key="tab.routeName"
          :to="{ name: tab.routeName }"
          class="btn btn-ghost btn-sm gap-2"
          :class="{ 'btn-active': route.name === tab.routeName }"
        >
          <component
            :is="tab.icon"
            v-if="tab.icon"
            :size="18"
            aria-hidden="true"
          />
          <span class="hidden sm:inline">{{ tab.label }}</span>
        </router-link>
      </nav>
    </div>

    <main :class="mainClass">
      <RouterView />
    </main>
  </div>
</template>
