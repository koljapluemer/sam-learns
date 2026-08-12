<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getTotalActiveTimeMs, getTotalTrialCount } from '@/shared/activity/activityQueries'
import { formatDuration } from '@/shared/stats/formatDuration'
import StatsPanel from '@/shared/stats/StatsPanel.vue'
import GlobalStatsSection from '@/shared/stats/GlobalStatsSection.vue'
import PageShell from '@/shared/shell/PageShell.vue'
import { listQuotes } from '../../entities/quote/quote'

const stats = ref<{ label: string; value: string | number }[]>([])

onMounted(async () => {
  const [timeMs, trials, quotes] = await Promise.all([
    getTotalActiveTimeMs('quotes'),
    getTotalTrialCount('quotes'),
    listQuotes()
  ])

  stats.value = [
    { label: 'Quotes added', value: quotes.length },
    { label: 'Flashcards graded', value: trials },
    { label: 'Time spent', value: formatDuration(timeMs) }
  ]
})
</script>

<template>
  <PageShell title="Stats">
    <StatsPanel :stats="stats" />

    <GlobalStatsSection />
  </PageShell>
</template>
