<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import GlobalStatsSection from '@/shared/stats/GlobalStatsSection.vue'
import PageShell from '@/shared/shell/PageShell.vue'

const WorldMapStatsSection = defineAsyncComponent(() => import('../../app/stats/WorldMapStatsSection.vue'))
</script>

<template>
  <PageShell title="Stats">
    <WorldMapStatsSection />

    <GlobalStatsSection />
  </PageShell>
</template>
