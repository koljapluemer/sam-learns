<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getTotalActiveTimeMs, getTotalTrialCount } from '@/shared/activity/activityQueries'
import { formatDuration } from '@/shared/stats/formatDuration'
import StatsPanel from '@/shared/stats/StatsPanel.vue'
import GlobalStatsSection from '@/shared/stats/GlobalStatsSection.vue'
import PageShell from '@/shared/shell/PageShell.vue'

const stats = ref<{ label: string; value: string | number }[]>([])

onMounted(async () => {
  const [timeMs, trials] = await Promise.all([getTotalActiveTimeMs('learn-flags'), getTotalTrialCount('learn-flags')])

  stats.value = [
    { label: 'Time spent', value: formatDuration(timeMs) },
    { label: 'Exercises done', value: trials }
  ]
})
</script>

<template>
  <PageShell title="Stats">
    <StatsPanel :stats="stats" />

    <GlobalStatsSection />
  </PageShell>
</template>
