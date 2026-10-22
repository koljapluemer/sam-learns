<script setup lang="ts">
defineOptions({
  name: 'HomePage'
})

import { apps, type AppDefinition } from './appRegistry'
import { isOnline } from './shared/offline/useOnline'
import { isAppAvailableOffline } from './shared/offline/offlineApps'

const screenshots = import.meta.glob<string>('./apps/*/meta/screenshot.webp', { eager: true, import: 'default' })

function screenshot(slug: string) {
  return screenshots[`./apps/${slug}/meta/screenshot.webp`]
}

function unavailable(app: AppDefinition) {
  return !isOnline.value && !isAppAvailableOffline(app)
}
</script>

<template>
  <section class="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8">
    <header class="space-y-3">
      <h1 class="text-4xl font-semibold text-base-content">
        Welcome to samlearns.
      </h1>
      <p class="max-w-2xl text-base text-xl">
        Below are experimental mini-apps for digital learning, across different topics. Feel free to browse around:
      </p>
    </header>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <router-link
        v-for="app in apps"
        :key="app.slug"
        class="card border border-base-300 bg-base-100 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        :class="{ 'pointer-events-none opacity-50': unavailable(app) }"
        :aria-disabled="unavailable(app)"
        :tabindex="unavailable(app) ? -1 : undefined"
        :to="{ name: app.slug }"
      >
        <figure>
          <img
            :src="screenshot(app.slug)"
            :alt="`${app.name} screenshot`"
            class="h-40 w-full object-cover"
          >
        </figure>
        <div class="card-body gap-3">
          <h2 class="card-title text-xl">
            {{ app.name }}
          </h2>
          <p class="text-sm text-base-content/70">
            {{ app.description }}
          </p>
          <div class="card-actions justify-end">
            <span
              v-if="unavailable(app)"
              class="badge badge-ghost"
            >{{ app.requiresNetwork ? 'Online only' : 'Not downloaded' }}</span>
            <span
              v-else
              class="btn btn-sm btn-primary"
            >Open</span>
          </div>
        </div>
      </router-link>
    </div>
  </section>
</template>
