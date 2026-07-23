<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { ChartItem } from 'chart.js'
import { appDb } from '../../db/appDb'
import { toDayKey } from '../../dumb/dayBoundary'
import { createDailyStatsChart } from './statsChart'
import { fillDailyRange, shortDateFormatter } from './dailyChart'
import GeneralStatsSection from '@/shared/stats/GeneralStatsSection.vue'

const chartCanvas = ref<HTMLCanvasElement | null>(null)
const hasData = ref(false)

function countByDay(days: string[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const day of days) {
    counts[day] = (counts[day] ?? 0) + 1
  }
  return counts
}

onMounted(async () => {
  const [words, reviewEvents] = await Promise.all([appDb.words.toArray(), appDb.reviewEvents.toArray()])

  const addedByDay = countByDay(words.map((word) => word.dayKey))
  const memorizedByDay = countByDay(
    words.filter((word) => word.memorizedAt).map((word) => toDayKey(word.memorizedAt as string))
  )
  const practicedByDay = countByDay(reviewEvents.map((event) => event.dayKey))

  const allDays = new Set([...Object.keys(addedByDay), ...Object.keys(memorizedByDay), ...Object.keys(practicedByDay)])
  if (allDays.size === 0) return
  hasData.value = true

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
  <div class="max-w-2xl mx-auto w-full p-4">
    <h1 class="text-xl font-semibold mb-4">
      Daily Progress
    </h1>

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
  <GeneralStatsSection />
</template>
