<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { apps } from '@/appRegistry'
import AppSubnav from './AppSubnav.vue'

const route = useRoute()
const app = computed(() => apps.find((candidate) => candidate.slug === route.meta.appSlug))
</script>

<template>
  <div class="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-4">
    <AppSubnav />
    <router-view />
    <footer
      v-if="app?.credits"
      class="mt-8 text-center text-xs text-base-content/60"
      v-html="app.credits"
    />
  </div>
</template>
