<script setup lang="ts">
defineOptions({
  name: 'HomePage'
})

import { apps } from './appRegistry'

const metaImages = import.meta.glob<string>('./apps/*/meta/*.webp', { eager: true, import: 'default' })

function metaImage(slug: string, name: 'logo' | 'screenshot') {
  return metaImages[`./apps/${slug}/meta/${name}.webp`]
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
        :to="{ name: app.slug }"
      >
        <img
          :src="metaImage(app.slug, 'logo')"
          :alt="`${app.name} logo`"
          class="absolute -top-4 -left-4 z-5 h-16 w-16 object-contain p-1"
        >
        <figure>
          <img
            :src="metaImage(app.slug, 'screenshot')"
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
            <span class="btn btn-sm btn-primary">Open</span>
          </div>
        </div>
      </router-link>
    </div>
  </section>
</template>
