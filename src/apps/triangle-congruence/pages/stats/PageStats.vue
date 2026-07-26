<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getTotalActiveTimeMs, getTotalTrialCount } from '@/shared/activity/activityQueries'
import { formatDuration } from '@/shared/stats/formatDuration'
import StatsPanel from '@/shared/stats/StatsPanel.vue'
import GlobalStatsSection from '@/shared/stats/GlobalStatsSection.vue'

const stats = ref<{ label: string; value: string | number }[]>([])

onMounted(async () => {
  const [timeMs, trials] = await Promise.all([
    getTotalActiveTimeMs('triangle-congruence'),
    getTotalTrialCount('triangle-congruence')
  ])
  stats.value = [
    { label: 'Time spent', value: formatDuration(timeMs) },
    { label: 'Exercises done', value: trials }
  ]
})
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
    <StatsPanel :stats="stats" />

    <GlobalStatsSection />
  </div>
</template>
