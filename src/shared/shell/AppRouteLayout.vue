<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { apps } from '@/appRegistry'
import GeneralInfoSection from '@/shared/info/GeneralInfoSection.vue'

const route = useRoute()
const app = computed(() => apps.find((candidate) => candidate.slug === route.meta.appSlug))
const isFullBleed = computed(() => route.meta.layout === 'full-bleed')
const isHomeRoute = computed(() => route.name === route.meta.appSlug)
// World Map's CMS preview iframe (?preview=1) embeds this route at a fixed,
// non-scrolling size, so the info section would just be invisible dead
// weight there - skip it rather than render unreachable content.
const isPreviewRoute = computed(() => route.query.preview === '1')
const showInfo = computed(() => isHomeRoute.value && !isPreviewRoute.value)
</script>

<template>
  <template v-if="isFullBleed">
    <router-view />
    <GeneralInfoSection v-if="showInfo" />
    <footer
      v-if="app?.credits"
      class="mt-8 text-center text-xs text-base-content/60"
      v-html="app.credits"
    />
  </template>
  <div
    v-else
    class="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-4"
  >
    <router-view />
    <GeneralInfoSection v-if="showInfo" />
    <footer
      v-if="app?.credits"
      class="mt-8 text-center text-xs text-base-content/60"
      v-html="app.credits"
    />
  </div>
</template>
