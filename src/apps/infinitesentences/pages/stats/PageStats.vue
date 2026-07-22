<script setup lang="ts">
// Port of linguanodon's infinitesentences app/statsApp.js.
import { computed, onMounted, ref } from 'vue'
import { Circle, Flame } from 'lucide-vue-next'
import { createPracticeStore, createUserSettingsStore } from '../../app/store'
import { loadLanguages } from '../../app/api'
import { createSentencesChart } from '../../app/statsChart'
import type { ChartItem } from 'chart.js'

function formatDateLabel(dateStr: string): string {
  const [, month, day] = dateStr.split('-')
  return `${month}/${day}`
}

const practiceStore = createPracticeStore()
const userSettings = createUserSettingsStore()

const last14Days = computed(() => {
  const counts = practiceStore.getLast14DaysSentenceCounts()
  return counts.map((day) => ({ date: day.date, practiced: day.count > 0 }))
})
const streak = computed(() => practiceStore.getCurrentStreak())

const chartCanvas = ref<HTMLCanvasElement | null>(null)

onMounted(async () => {
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
      <h2 class="text-xl font-semibold mb-4">
        Streak
      </h2>
      <div class="flex items-center gap-4 overflow-x-auto">
        <div class="flex gap-1">
          <span
            v-for="(day, index) in last14Days"
            :key="index"
          >
            <Flame
              v-if="day.practiced"
              class="w-4 h-4 text-orange-500"
            />
            <Circle
              v-else
              class="w-4 h-4"
            />
          </span>
        </div>
        <div class="text-2xl font-bold">
          {{ streak }}
        </div>
      </div>
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
  </div>
</template>
