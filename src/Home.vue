<script setup lang="ts">
defineOptions({
  name: 'HomePage'
})

import { apps } from './appRegistry'
</script>

<template>
  <section class="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8">
    <header class="space-y-3">
      <p class="text-sm uppercase tracking-[0.3em] text-base-content/60">
        Learning Apps
      </p>
      <h1 class="text-4xl font-semibold text-base-content">
        Small interfaces for practicing specific skills
      </h1>
      <p class="max-w-2xl text-base text-base-content/70">
        Each route is a standalone learning tool integrated into the same app shell.
      </p>
    </header>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <router-link
        v-for="app in apps"
        :key="app.slug"
        class="card border border-base-300 bg-base-100 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        :to="{ name: app.slug }"
      >
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
