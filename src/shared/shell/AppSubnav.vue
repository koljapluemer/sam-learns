<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { apps } from '@/appRegistry'

const route = useRoute()
const appSlug = computed(() => (typeof route.meta.appSlug === 'string' ? route.meta.appSlug : ''))
const app = computed(() => apps.find((candidate) => candidate.slug === appSlug.value))

function routeName(path: string): string {
  return path === '' ? appSlug.value : `${appSlug.value}-${path}`
}

function label(path: string, explicitLabel?: string): string {
  if (explicitLabel) return explicitLabel
  if (path === '') return 'Home'
  return path.charAt(0).toUpperCase() + path.slice(1)
}
</script>

<template>
  <nav
    v-if="app?.routes && app.routes.length > 1"
    class="flex flex-wrap gap-2"
  >
    <router-link
      v-for="appRoute in app.routes"
      :key="appRoute.path"
      :to="{ name: routeName(appRoute.path) }"
      class="btn btn-sm rounded-full"
      :class="{ 'btn-active': route.name === routeName(appRoute.path) }"
    >
      {{ label(appRoute.path, appRoute.label) }}
    </router-link>
  </nav>
</template>
