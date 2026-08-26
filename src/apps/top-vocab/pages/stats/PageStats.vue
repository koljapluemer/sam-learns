<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getTotalActiveTimeMs, getTotalTrialCount } from '@/shared/activity/activityQueries'
import GlobalStatsSection from '@/shared/stats/GlobalStatsSection.vue'
import StatsPanel from '@/shared/stats/StatsPanel.vue'
import { formatDuration } from '@/shared/stats/formatDuration'
import PageShell from '@/shared/shell/PageShell.vue'

const stats = ref<{ label: string; value: string | number }[]>([])

onMounted(async () => {
  const [timeMs, trials] = await Promise.all([getTotalActiveTimeMs('top-vocab'), getTotalTrialCount('top-vocab')])
  stats.value = [
    { label: 'Time spent', value: formatDuration(timeMs) },
    { label: 'Cards reviewed', value: trials }
  ]
})
</script>

<template>
  <PageShell title="Stats">
    <StatsPanel :stats="stats" />
    <GlobalStatsSection />
  </PageShell>
</template>
