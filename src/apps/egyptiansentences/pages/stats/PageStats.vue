<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Trophy } from 'lucide-vue-next'
import { loadHighscores } from '../../app/useGameSession'
import { getTotalActiveTimeMs, getTotalTrialCount } from '@/shared/activity/activityQueries'
import { formatDuration } from '@/shared/stats/formatDuration'
import StatsPanel from '@/shared/stats/StatsPanel.vue'
import GlobalStatsSection from '@/shared/stats/GlobalStatsSection.vue'
import PageShell from '@/shared/shell/PageShell.vue'
import type { Highscore } from '../../app/types'

const stats = ref<{ label: string; value: string | number }[]>([])
const sortedHighscores = ref<Highscore[]>([])

function formatDate(dateIso: string): string {
  return new Date(dateIso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

onMounted(async () => {
  const [timeMs, trials] = await Promise.all([
    getTotalActiveTimeMs('egyptiansentences'),
    getTotalTrialCount('egyptiansentences')
  ])
  stats.value = [
    { label: 'Time in active games', value: formatDuration(timeMs) },
    { label: 'Games played', value: trials }
  ]
  sortedHighscores.value = [...loadHighscores()].sort((a, b) => b.score - a.score)
})
</script>

<template>
  <PageShell title="Stats">
    <StatsPanel :stats="stats" />

    <div
      v-if="sortedHighscores.length"
      class="glass border border-base-200/60 rounded-2xl shadow p-6 w-full grid gap-3"
    >
      <h2 class="font-semibold flex items-center gap-2">
        <Trophy class="w-5 h-5" />
        Highscore
      </h2>
      <ol class="grid gap-1">
        <li
          v-for="(highscore, index) in sortedHighscores.slice(0, 10)"
          :key="index"
          class="flex justify-between"
        >
          <span class="font-medium">{{ highscore.score }}</span>
          <span class="text-base-content/90">{{ formatDate(highscore.date) }}</span>
        </li>
      </ol>
    </div>

    <GlobalStatsSection />
  </PageShell>
</template>
