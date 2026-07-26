<script setup lang="ts">
// Ported from linguanodon's comprehensible_input stats.js - totals computed
// client-side from local watch-time records, grouped by language. Extended
// with a per-day-per-language stacked chart and cross-app stats.
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue'
import { getAllWatchRecords, getDailyWatchTime } from '../../app/useWatchTracker'
import { createDailyWatchTimeChart } from '../../app/statsChart'
import { toLocalDayKey } from '@/shared/activity/dayBoundary'
import { getTotalTrialCount } from '@/shared/activity/activityQueries'
import StatsPanel from '@/shared/stats/StatsPanel.vue'
import GlobalStatsSection from '@/shared/stats/GlobalStatsSection.vue'
import type { DailyWatchTimeRow } from '../../app/types'

const DAYS_TO_SHOW = 14

const secondsByLanguage = ref<{ languageName: string; seconds: number }[]>([])
const dailyRows = ref<DailyWatchTimeRow[]>([])
const trialCount = ref(0)

function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${remainingSeconds}s`
  return `${remainingSeconds}s`
}

const stats = computed(() => [
  { label: 'Videos submitted', value: trialCount.value },
  { label: 'Total watch time', value: formatDuration(secondsByLanguage.value.reduce((sum, entry) => sum + entry.seconds, 0)) }
])

function lastDayKeys(count: number): string[] {
  const keys: string[] = []
  const now = new Date()
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    keys.push(toLocalDayKey(date.toISOString()))
  }
  return keys
}

function formatDayLabel(dayKey: string): string {
  const [, month, day] = dayKey.split('-')
  return `${month}/${day}`
}

const dailyChartCanvas = useTemplateRef<HTMLCanvasElement>('dailyChartCanvas')

watch(
  dailyRows,
  (rows) => {
    if (!dailyChartCanvas.value || rows.length === 0) return

    const days = lastDayKeys(DAYS_TO_SHOW)
    const languageNames = [...new Set(rows.map((row) => row.languageName))]
    const minutesByLanguage = days.map((day) => {
      const minutes: Record<string, number> = {}
      for (const row of rows) {
        if (row.dayKey !== day) continue
        minutes[row.languageName] = (minutes[row.languageName] ?? 0) + row.seconds / 60
      }
      return { minutes }
    })

    createDailyWatchTimeChart(dailyChartCanvas.value, days.map(formatDayLabel), languageNames, minutesByLanguage)
  },
  { flush: 'post' }
)

onMounted(async () => {
  const [records, dailyWatchTime, trials] = await Promise.all([
    getAllWatchRecords(),
    getDailyWatchTime(),
    getTotalTrialCount('comprehensible-input')
  ])

  const totals = new Map<string, number>()
  for (const record of records) {
    totals.set(record.languageName, (totals.get(record.languageName) ?? 0) + record.seconds)
  }
  secondsByLanguage.value = [...totals.entries()].map(([languageName, seconds]) => ({ languageName, seconds }))
  dailyRows.value = dailyWatchTime
  trialCount.value = trials
})
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4">
    <h1 class="text-2xl font-bold">
      Stats
    </h1>

    <StatsPanel :stats="stats" />

    <div
      v-if="secondsByLanguage.length === 0"
      class="rounded-box border border-base-300 bg-base-100 p-6 text-sm text-base-content/70"
    >
      No watch time tracked yet.
    </div>
    <template v-else>
      <div class="rounded-box border border-base-300 bg-base-100 p-4">
        <h2 class="mb-4 text-lg font-semibold">
          Watch time by language
        </h2>
        <div class="stats stats-vertical w-full border border-base-300 bg-base-200 shadow-sm sm:stats-horizontal">
          <div
            v-for="entry in secondsByLanguage"
            :key="entry.languageName"
            class="stat"
          >
            <div class="stat-title">
              {{ entry.languageName }}
            </div>
            <div class="stat-value text-primary">
              {{ formatDuration(entry.seconds) }}
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-box border border-base-300 bg-base-100 p-4">
        <h2 class="mb-4 text-lg font-semibold">
          Watch time per day
        </h2>
        <div class="h-72">
          <canvas ref="dailyChartCanvas" />
        </div>
      </div>
    </template>

    <GlobalStatsSection />
  </div>
</template>
