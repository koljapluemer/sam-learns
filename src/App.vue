<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { BarChart3, Heart, Home, Info, Play, Settings, X } from 'lucide-vue-next'
import { apps, type AppRouteDefinition } from '@/appRegistry'
import { DEFAULT_SHELL_STATE, shellState } from '@/shared/shell/shellState'
import { routeNameForPath } from '@/shared/shell/appRoutePath'
import { useLocalSetting } from '@/shared/settings/useLocalSetting'
import { useCurrentApp } from '@/shared/shell/useCurrentApp'
import AppInfoText from '@/shared/shell/AppInfoText.vue'
import UserInteractionDialog from '@/shared/account/UserInteractionDialog.vue'

const route = useRoute()

const isInfoBoxDismissed = useLocalSetting('app-info-dismissed', false)

const currentApp = useCurrentApp()
// The global /info route has no `appSlug` meta, so it carries its origin app in
// `?app=<slug>`. Resolve it here so the shell keeps that app's nav tabs - and a
// way back into the app - while on /info.
const app = computed(() => {
  if (currentApp.value) return currentApp.value
  const fromInfo = route.name === 'info' && typeof route.query.app === 'string' ? route.query.app : ''
  return fromInfo ? apps.find((candidate) => candidate.slug === fromInfo) : undefined
})
const hasBottomDock = computed(() => route.meta.hasBottomDock === true)

const appName = computed(() =>
  shellState.title !== DEFAULT_SHELL_STATE.title ? shellState.title : (app.value?.name ?? '')
)

const mainClass = computed(() =>
  route.meta.layout === 'full-bleed'
    ? 'w-full min-h-screen'
    : 'flex w-full min-h-screen justify-center bg-base-200/40 px-4 pb-8 pt-20'
)

type NavTab = { routeName: string; label: string; icon?: typeof Home }

// Every app has the same three routes: '' (the practice/play page the user
// lands on, labeled "Practice"), then 'stats' and 'settings'. Order them the
// same way regardless of how they're declared in the registry.
const tabs = computed<NavTab[]>(() => {
  if (!app.value) {
    return [
      { routeName: 'stats', label: 'Stats', icon: BarChart3 },
      { routeName: 'settings', label: 'Settings', icon: Settings }
    ]
  }

  const slug = app.value.slug
  const byPath = (path: string) => app.value?.routes.find((r) => r.path === path)
  const ordered = [byPath(''), byPath('stats'), byPath('settings')].filter(
    (r): r is AppRouteDefinition => r !== undefined
  )

  return ordered.map((r) => ({
    routeName: routeNameForPath(slug, r.path),
    label: r.label ?? (r.path === 'stats' ? 'Stats' : r.path === 'settings' ? 'Settings' : 'Practice'),
    icon: r.path === 'stats' ? BarChart3 : r.path === 'settings' ? Settings : Play
  }))
})
</script>

<template>
  <div class="min-h-screen w-full text-base-content">
    <div class="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-start justify-between gap-2 p-3">
      <div
        class="pointer-events-auto flex items-center justify-start gap-1 rounded-box border border-base-300 bg-base-100/90 p-1 shadow-sm backdrop-blur"
      >
        <router-link
          :to="{ name: 'home' }"
          class="btn btn-sm gap-2"
          aria-label="Sam Learns Things home"
        >
          <Home
            :size="18"
            aria-hidden="true"
          />
          <span class="hidden sm:inline">Sam Learns<template v-if="appName"> | {{ appName }}</template></span>
        </router-link>
      </div>

      <nav
        class="pointer-events-auto flex max-w-[70vw] flex-wrap items-center justify-end gap-1 rounded-box border border-base-300 bg-base-100/90 p-1 shadow-sm backdrop-blur"
      >
        <router-link
          v-for="tab in tabs"
          :key="tab.routeName"
          :to="{ name: tab.routeName }"
          class="btn btn-sm gap-2"
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
        <router-link
          :to="{ name: 'info', query: app ? { app: app.slug } : {} }"
          class="btn btn-sm gap-2"
          :class="{ 'btn-active': route.name === 'info' }"
          aria-label="Info and credits"
        >
          <Info
            :size="18"
            aria-hidden="true"
          />
          <span class="hidden sm:inline">Info</span>
        </router-link>
        <a
          href="https://ko-fi.com/S6S81CWUVD"
          target="_blank"
          rel="noopener"
          class="btn btn-sm gap-2"
          aria-label="Support my work on ko-fi"
        >
          <Heart
            :size="18"
            aria-hidden="true"
          />
          <span class="hidden sm:inline">Support</span>
        </a>
      </nav>
    </div>

    <main :class="mainClass">
      <RouterView />
    </main>

    <UserInteractionDialog />

    <footer
      v-if="!isInfoBoxDismissed"
      class="pointer-events-none fixed inset-x-0 z-50 flex items-center justify-start p-3 w-full"
      :class="hasBottomDock ? 'bottom-20 sm:bottom-24' : 'bottom-0'"
    >
      <div
        class="pointer-events-auto relative flex max-w-sm flex-col gap-2 rounded-box border border-base-300 bg-base-100/90 p-3 shadow-sm backdrop-blur"
      >
        <AppInfoText />
        <button
          type="button"
          class="btn btn-xs self-start"
          aria-label="Dismiss info"
          @click="isInfoBoxDismissed = true"
        >
          Got it
          <X
            :size="14"
            aria-hidden="true"
          />
        </button>
      </div>
    </footer>
  </div>
</template>
