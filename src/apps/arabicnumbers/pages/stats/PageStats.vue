<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { appDb } from '../../db/appDb'
import { calculateColor } from '../../app/helpers'
import type { ApiNumber } from '../../app/types'
import { getTotalActiveTimeMs, getTotalTrialCount } from '@/shared/activity/activityQueries'
import { formatDuration } from '@/shared/stats/formatDuration'
import StatsPanel from '@/shared/stats/StatsPanel.vue'
import GlobalStatsSection from '@/shared/stats/GlobalStatsSection.vue'

const stats = ref<{ label: string; value: string | number }[]>([])
const levels = ref<number[]>([])

onMounted(async () => {
  const [timeMs, trials, response, storedNumberState] = await Promise.all([
    getTotalActiveTimeMs('arabicnumbers'),
    getTotalTrialCount('arabicnumbers'),
    fetch('/data/arabicnumbers/numbers.json'),
    appDb.numberState.toArray()
  ])

  stats.value = [
    { label: 'Time spent', value: formatDuration(timeMs) },
    { label: 'Exercises answered', value: trials }
  ]

  if (response.ok) {
    const apiNumbers = (await response.json()) as ApiNumber[]
    const levelByVal = new Map(storedNumberState.map((row) => [row.val, row.level]))
    levels.value = apiNumbers
      .slice()
      .sort((a, b) => a.value - b.value)
      .map((entry) => levelByVal.get(entry.value) ?? 0)
  }
})
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-8 p-4">
    <h1 class="text-2xl font-semibold">
      Stats
    </h1>

    <StatsPanel :stats="stats" />

    <div v-if="levels.length > 0">
      <h2 class="mb-2 text-lg font-semibold">
        Number levels
      </h2>
      <div
        class="grid gap-2"
        style="grid-template-columns: repeat(10, 1rem)"
      >
        <div
          v-for="(level, index) in levels"
          :key="index"
          class="w-4 h-4 flex items-center justify-center shadow-xs relative border border-gray-400 rounded"
        >
          <div
            class="absolute inset-0 bottom-0 rounded"
            :style="{ height: level * 10 + '%', backgroundColor: calculateColor(level) }"
          />
        </div>
      </div>
    </div>

    <GlobalStatsSection />
  </div>
</template>
