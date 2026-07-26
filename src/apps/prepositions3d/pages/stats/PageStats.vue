<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getTotalActiveTimeMs, getTotalTrialCount } from '@/shared/activity/activityQueries'
import { formatDuration } from '@/shared/stats/formatDuration'
import StatsPanel from '@/shared/stats/StatsPanel.vue'
import GlobalStatsSection from '@/shared/stats/GlobalStatsSection.vue'

const stats = ref<{ label: string; value: string | number }[]>([])

onMounted(async () => {
  const [timeMs, trials] = await Promise.all([
    getTotalActiveTimeMs('prepositions3d'),
    getTotalTrialCount('prepositions3d')
  ])
  stats.value = [
    { label: 'Time spent', value: formatDuration(timeMs) },
    { label: 'Cups placed correctly', value: trials }
  ]
})
</script>

<template>
  <div class="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
    <h1 class="text-2xl font-semibold">
      Stats
    </h1>
    <StatsPanel :stats="stats" />

    <GlobalStatsSection />
  </div>
</template>
