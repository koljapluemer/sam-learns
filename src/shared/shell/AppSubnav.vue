<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { apps } from '@/appRegistry'
import { routeNameForPath, isDynamicRoutePath } from '@/shared/shell/appRoutePath'

const route = useRoute()
const appSlug = computed(() => (typeof route.meta.appSlug === 'string' ? route.meta.appSlug : ''))
const app = computed(() => apps.find((candidate) => candidate.slug === appSlug.value))
// Routes with a required param (e.g. `practice/:lessonKey`) have no single
// destination, so they can't be a generic tab - only static routes show up.
const tabRoutes = computed(() => app.value?.routes?.filter((r) => !isDynamicRoutePath(r.path)) ?? [])

function routeName(path: string): string {
  return routeNameForPath(appSlug.value, path)
}

function label(path: string, explicitLabel?: string): string {
  if (explicitLabel) return explicitLabel
  if (path === '') return 'Home'
  return path.charAt(0).toUpperCase() + path.slice(1)
}
</script>

<template>
  <nav
    v-if="tabRoutes.length > 1"
    class="flex flex-wrap gap-2"
  >
    <router-link
      v-for="appRoute in tabRoutes"
      :key="appRoute.path"
      :to="{ name: routeName(appRoute.path) }"
      class="btn btn-sm rounded-full"
      :class="{ 'btn-active': route.name === routeName(appRoute.path) }"
    >
      {{ label(appRoute.path, appRoute.label) }}
    </router-link>
  </nav>
</template>
