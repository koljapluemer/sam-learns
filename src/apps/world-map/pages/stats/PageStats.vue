<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import GlobalStatsSection from '@/shared/stats/GlobalStatsSection.vue'

const WorldMapStatsSection = defineAsyncComponent(() => import('../../app/stats/WorldMapStatsSection.vue'))
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
    <WorldMapStatsSection />

    <GlobalStatsSection />
  </div>
</template>
