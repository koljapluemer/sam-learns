<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { appDb } from '@/apps/world-map/db/appDb'
import { toLocalDayKey } from '@/shared/activity/dayBoundary'
import StatsPanel from '@/shared/stats/StatsPanel.vue'

const stats = ref<{ label: string; value: string | number }[]>([])

onMounted(async () => {
  const [countriesPracticed, events] = await Promise.all([
    appDb.countryProgress.count(),
    appDb.learningEvents.toArray()
  ])

  const today = toLocalDayKey(new Date().toISOString())
  const attemptsToday = events.filter((event) => toLocalDayKey(event.timestamp) === today).length

  stats.value = [
    { label: 'Countries practiced', value: countriesPracticed },
    { label: 'Attempts today', value: attemptsToday },
    { label: 'Total attempts', value: events.length }
  ]
})
</script>

<template>
  <StatsPanel :stats="stats" />
</template>
