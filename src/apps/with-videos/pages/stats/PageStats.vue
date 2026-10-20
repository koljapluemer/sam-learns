<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { appDb } from '../../db/appDb'
import { getTotalActiveTimeMs, getTotalTrialCount } from '@/shared/activity/activityQueries'
import { formatDuration } from '@/shared/stats/formatDuration'
import StatsPanel from '@/shared/stats/StatsPanel.vue'
import GlobalStatsSection from '@/shared/stats/GlobalStatsSection.vue'
import PageShell from '@/shared/shell/PageShell.vue'

const stats = ref<{ label: string; value: string | number }[]>([])

onMounted(async () => {
  const [timeMs, trials, vocabCardCount] = await Promise.all([
    getTotalActiveTimeMs('with-videos'),
    getTotalTrialCount('with-videos'),
    appDb.vocabCards.count()
  ])

  stats.value = [
    { label: 'Time spent', value: formatDuration(timeMs) },
    { label: 'Snippets watched', value: trials },
    { label: 'Vocab words seen', value: vocabCardCount }
  ]
})
</script>

<template>
  <PageShell title="Stats">
    <StatsPanel :stats="stats" />

    <GlobalStatsSection />
  </PageShell>
</template>
