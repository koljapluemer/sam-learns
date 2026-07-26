
<script setup lang="ts">
// Cross-app stats: two stacked bar charts (trials/day/app, time-spent/day/app)
// built from the shared activityDb. Every PageStats.vue renders its app
// stats first, then this component - see @agents.md.
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import { BarController, BarElement, CategoryScale, Chart, Legend, LinearScale, Tooltip } from 'chart.js'
import { activityDb } from '@/shared/activity/activityDb'
import { toLocalDayKey } from '@/shared/activity/dayBoundary'
import { apps } from '@/appRegistry'
import { colorForAppSlug } from './appColor'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Legend, Tooltip)

const DAYS_TO_SHOW = 14

const appNameBySlug = new Map(apps.map((app) => [app.slug, app.name]))
const trialLabelBySlug = new Map(apps.map((app) => [app.slug, app.stats.trialLabel]))

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

type AppSeries = { appSlug: string; data: number[]; total: number }

function buildSeries(days: string[], entries: { appSlug: string; dayKey: string; value: number }[]): AppSeries[] {
  const bySlug = new Map<string, Map<string, number>>()

  for (const entry of entries) {
    if (!bySlug.has(entry.appSlug)) bySlug.set(entry.appSlug, new Map())
    const byDay = bySlug.get(entry.appSlug)!
    byDay.set(entry.dayKey, (byDay.get(entry.dayKey) ?? 0) + entry.value)
  }

  return [...bySlug.entries()]
    .map(([appSlug, byDay]) => {
      const data = days.map((day) => byDay.get(day) ?? 0)
      return { appSlug, data, total: data.reduce((sum, value) => sum + value, 0) }
    })
    .filter((series) => series.total > 0)
    .sort((a, b) => b.total - a.total)
}

const hasData = ref(false)
const trialsCanvas = useTemplateRef<HTMLCanvasElement>('trialsCanvas')
const timeCanvas = useTemplateRef<HTMLCanvasElement>('timeCanvas')

let trialsChart: Chart | null = null
let timeChart: Chart | null = null

async function loadCharts() {
  const days = lastDayKeys(DAYS_TO_SHOW)
  const labels = days.map(formatDayLabel)

  const [eventRows, timeRows] = await Promise.all([
    activityDb.activityEvents.toArray(),
    activityDb.activityTimeEntries.toArray()
  ])

  const trialSeries = buildSeries(
    days,
    eventRows.map((row) => ({ appSlug: row.appSlug, dayKey: toLocalDayKey(row.timestamp), value: 1 }))
  )
  const timeSeries = buildSeries(
    days,
    timeRows.map((row) => ({ appSlug: row.appSlug, dayKey: row.dayKey, value: row.ms / 60_000 }))
  )

  hasData.value = trialSeries.length > 0 || timeSeries.length > 0
  if (!hasData.value) return

  await new Promise((resolve) => requestAnimationFrame(resolve))
  trialsChart?.destroy()
  timeChart?.destroy()

  if (trialsCanvas.value && trialSeries.length > 0) {
    trialsChart = new Chart(trialsCanvas.value, {
      type: 'bar',
      data: {
        labels,
        datasets: trialSeries.map((series) => ({
          label: `${appNameBySlug.get(series.appSlug) ?? series.appSlug} (trial: ${trialLabelBySlug.get(series.appSlug) ?? 'n/a'})`,
          data: series.data,
          backgroundColor: colorForAppSlug(series.appSlug)
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    })
  }

  if (timeCanvas.value && timeSeries.length > 0) {
    timeChart = new Chart(timeCanvas.value, {
      type: 'bar',
      data: {
        labels,
        datasets: timeSeries.map((series) => ({
          label: appNameBySlug.get(series.appSlug) ?? series.appSlug,
          data: series.data.map((minutes) => Math.round(minutes * 10) / 10),
          backgroundColor: colorForAppSlug(series.appSlug)
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true, title: { display: true, text: 'minutes' } }
        }
      }
    })
  }
}

onMounted(() => {
  void loadCharts()
})

onUnmounted(() => {
  trialsChart?.destroy()
  timeChart?.destroy()
})
</script>

<template>
  <section class="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
    <header class="space-y-2">
      <h2 class="text-2xl font-semibold">
        Global Stats
      </h2>
      <p class="text-sm text-base-content/70">
        Last {{ DAYS_TO_SHOW }} days, across all apps. Stored locally on this device.
      </p>
    </header>

    <div
      v-if="!hasData"
      class="rounded-box border border-base-300 bg-base-100 p-10 text-center text-sm text-base-content/70"
    >
      No activity recorded yet. Do a few exercises in any app to see stats here.
    </div>

    <template v-else>
      <div class="rounded-box border border-base-300 bg-base-100 p-4">
        <h3 class="mb-4 text-lg font-semibold">
          Trials per day
        </h3>
        <div class="h-72">
          <canvas ref="trialsCanvas" />
        </div>
      </div>

      <div class="rounded-box border border-base-300 bg-base-100 p-4">
        <h3 class="mb-4 text-lg font-semibold">
          Time spent per day
        </h3>
        <div class="h-72">
          <canvas ref="timeCanvas" />
        </div>
      </div>
    </template>
  </section>
</template>
