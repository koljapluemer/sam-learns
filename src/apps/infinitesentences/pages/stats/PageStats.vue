<script setup lang="ts">
// Port of linguanodon's infinitesentences app/statsApp.js.
import { onMounted, ref } from 'vue'
import { createPracticeStore, createUserSettingsStore } from '../../app/store'
import { loadLanguages } from '../../app/api'
import { createSentencesChart } from '../../app/statsChart'
import { getTotalActiveTimeMs, getTotalTrialCount } from '@/shared/activity/activityQueries'
import { formatDuration } from '@/shared/stats/formatDuration'
import StatsPanel from '@/shared/stats/StatsPanel.vue'
import GlobalStatsSection from '@/shared/stats/GlobalStatsSection.vue'
import type { ChartItem } from 'chart.js'

function formatDateLabel(dateStr: string): string {
  const [, month, day] = dateStr.split('-')
  return `${month}/${day}`
}

const practiceStore = createPracticeStore()
const userSettings = createUserSettingsStore()

const stats = ref<{ label: string; value: string | number }[]>([])
const chartCanvas = ref<HTMLCanvasElement | null>(null)

onMounted(async () => {
  const [timeMs, trials] = await Promise.all([getTotalActiveTimeMs('infinitesentences'), getTotalTrialCount('infinitesentences')])
  stats.value = [
    { label: 'Time spent', value: formatDuration(timeMs) },
    { label: 'Sentences done', value: trials }
  ]

  const rawData = practiceStore.getLast14DaysSentenceCountsByLanguage()
  const languageIsos = practiceStore.getAllPracticedLanguages()
  const labels = rawData.map((point) => formatDateLabel(point.date))

  let languageNames: Record<string, string> = {}
  try {
    const languages = await loadLanguages()
    const languagesByCode = new Map(languages.map((language) => [language.code, language]))
    languageNames = Object.fromEntries(languageIsos.map((iso) => [iso, languagesByCode.get(iso)?.displayName || iso]))
  } catch (error) {
    console.warn('Failed to load language names:', error)
  }

  const totalsFallback = practiceStore.getLast14DaysSentenceCounts().map((d) => d.count)

  if (!chartCanvas.value) return
  createSentencesChart(
    chartCanvas.value as ChartItem,
    labels,
    languageIsos,
    languageNames,
    rawData,
    totalsFallback
  )
})
</script>

<template>
  <div class="max-w-2xl mx-auto w-full p-4">
    <div class="mb-6">
      <StatsPanel :stats="stats" />
    </div>

    <div class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold">
          Sentences Done
        </h2>
        <span class="text-sm opacity-70">Goal: {{ userSettings.dailySentenceGoal }}/day</span>
      </div>
      <div
        class="w-full"
        style="height: 300px"
      >
        <canvas ref="chartCanvas" />
      </div>
    </div>

    <GlobalStatsSection />
  </div>
</template>
