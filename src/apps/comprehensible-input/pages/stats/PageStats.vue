<script setup lang="ts">
// Ported from linguanodon's comprehensible_input stats.js - totals computed
// client-side from local watch-time records, grouped by language.
import { onMounted, ref } from 'vue'
import { getAllWatchRecords } from '../../app/useWatchTracker'

const secondsByLanguage = ref<{ languageName: string; seconds: number }[]>([])

function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${remainingSeconds}s`
  return `${remainingSeconds}s`
}

onMounted(async () => {
  const records = await getAllWatchRecords()
  const totals = new Map<string, number>()
  for (const record of records) {
    totals.set(record.languageName, (totals.get(record.languageName) ?? 0) + record.seconds)
  }
  secondsByLanguage.value = [...totals.entries()].map(([languageName, seconds]) => ({ languageName, seconds }))
})
</script>

<template>
  <div class="p-4">
    <h1
      v-if="secondsByLanguage.length === 0"
      class="text-lg font-semibold"
    >
      No watch time tracked yet.
    </h1>
    <template v-else>
      <h1 class="text-2xl font-bold mb-4">
        Watch time by language
      </h1>
      <div class="stats stats-vertical w-full border border-base-300 bg-base-100 shadow-sm sm:stats-horizontal">
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
    </template>
  </div>
</template>
