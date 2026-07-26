<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { appDb } from '../../db/appDb'
import { getTotalActiveTimeMs, getTotalTrialCount } from '@/shared/activity/activityQueries'
import { toLocalDayKey } from '@/shared/activity/dayBoundary'
import { formatDuration } from '@/shared/stats/formatDuration'
import StatsPanel from '@/shared/stats/StatsPanel.vue'
import GlobalStatsSection from '@/shared/stats/GlobalStatsSection.vue'

const stats = ref<{ label: string; value: string | number }[]>([])
const dailyRows = ref<{ day: string; wpm: number; accuracy: number }[]>([])

onMounted(async () => {
  const [timeMs, trials, lineAttempts] = await Promise.all([
    getTotalActiveTimeMs('typingpractice'),
    getTotalTrialCount('typingpractice'),
    appDb.lineAttempts.toArray()
  ])

  stats.value = [
    { label: 'Time spent', value: formatDuration(timeMs) },
    { label: 'Typing sessions', value: trials }
  ]

  const byDay = new Map<string, { words: number; chars: number; mistakes: number; ms: number }>()
  for (const row of lineAttempts) {
    const day = toLocalDayKey(row.timestamp)
    const current = byDay.get(day) ?? { words: 0, chars: 0, mistakes: 0, ms: 0 }
    byDay.set(day, {
      words: current.words + row.words,
      chars: current.chars + row.chars,
      mistakes: current.mistakes + row.mistakes,
      ms: current.ms + row.ms
    })
  }

  dailyRows.value = [...byDay.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([day, totals]) => ({
      day,
      wpm: totals.ms > 0 ? Math.round(totals.words / (totals.ms / 60000)) : 0,
      accuracy: totals.chars > 0 ? Math.round(((totals.chars - totals.mistakes) / totals.chars) * 100) : 100
    }))
})
</script>

<template>
  <div class="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4">
    <h1 class="text-2xl font-semibold">
      Stats
    </h1>
    <StatsPanel :stats="stats" />

    <div
      v-if="dailyRows.length > 0"
      class="overflow-x-auto"
    >
      <h2 class="mb-2 text-lg font-semibold">
        WPM / accuracy per day
      </h2>
      <table class="table table-sm">
        <thead>
          <tr>
            <th>Date</th>
            <th class="text-right">
              WPM
            </th>
            <th class="text-right">
              Accuracy
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in dailyRows"
            :key="row.day"
          >
            <td>{{ row.day }}</td>
            <td class="text-right">
              {{ row.wpm }}
            </td>
            <td class="text-right">
              {{ row.accuracy }}%
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <GlobalStatsSection />
  </div>
</template>
