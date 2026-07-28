<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import type { ChartItem } from 'chart.js'
import { appDb } from '../../db/appDb'
import { toDayKey } from '../../dumb/dayBoundary'
import { createDailyStatsChart } from './statsChart'
import { fillDailyRange, shortDateFormatter } from './dailyChart'
import { getTotalActiveTimeMs, getTotalTrialCount } from '@/shared/activity/activityQueries'
import { formatDuration } from '@/shared/stats/formatDuration'
import StatsPanel from '@/shared/stats/StatsPanel.vue'
import GlobalStatsSection from '@/shared/stats/GlobalStatsSection.vue'
import PageShell from '@/shared/shell/PageShell.vue'

const chartCanvas = ref<HTMLCanvasElement | null>(null)
const hasData = ref(false)
const stats = ref<{ label: string; value: string | number }[]>([])

function countByDay(days: string[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const day of days) {
    counts[day] = (counts[day] ?? 0) + 1
  }
  return counts
}

onMounted(async () => {
  const [words, reviewEvents, timeMs, trials] = await Promise.all([
    appDb.words.toArray(),
    appDb.reviewEvents.toArray(),
    getTotalActiveTimeMs('20-words'),
    getTotalTrialCount('20-words')
  ])

  stats.value = [
    { label: 'Time spent', value: formatDuration(timeMs) },
    { label: 'Words added + memorized same-day', value: trials }
  ]

  const addedByDay = countByDay(words.map((word) => word.dayKey))
  const memorizedByDay = countByDay(
    words.filter((word) => word.memorizedAt).map((word) => toDayKey(word.memorizedAt as string))
  )
  const practicedByDay = countByDay(reviewEvents.map((event) => event.dayKey))

  const allDays = new Set([...Object.keys(addedByDay), ...Object.keys(memorizedByDay), ...Object.keys(practicedByDay)])
  if (allDays.size === 0) return
  hasData.value = true
  // hasData just flipped the v-else branch on - the <canvas> doesn't exist in
  // the DOM until Vue flushes that change, so the ref below would be null
  // without waiting a tick first.
  await nextTick()

  const points = fillDailyRange(
    Array.from(allDays, (day) => ({ day })),
    (day) => ({ day })
  )

  const labels = points.map((point) => shortDateFormatter.format(new Date(`${point.day}T00:00:00`)))
  const added = points.map((point) => addedByDay[point.day] ?? 0)
  const memorized = points.map((point) => memorizedByDay[point.day] ?? 0)
  const practiced = points.map((point) => practicedByDay[point.day] ?? 0)

  if (!chartCanvas.value) return
  createDailyStatsChart(chartCanvas.value as ChartItem, labels, added, memorized, practiced)
})
</script>

<template>
  <PageShell title="Stats">
    <StatsPanel :stats="stats" />

    <div>
      <h2 class="mb-2 text-lg font-semibold">
        Daily Progress
      </h2>

      <div
        v-if="!hasData"
        class="text-sm opacity-70"
      >
        No activity yet. Add and practice some words to see stats here.
      </div>
      <div
        v-else
        class="w-full"
        style="height: 320px"
      >
        <canvas ref="chartCanvas" />
      </div>
    </div>

    <GlobalStatsSection />
  </PageShell>
</template>
