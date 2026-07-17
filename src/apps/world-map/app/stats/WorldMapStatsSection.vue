<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { State } from 'ts-fsrs'
import { appDb } from '@/apps/world-map/db/appDb'
import { getRetrievability } from '@/apps/world-map/entities/progress/progressScheduler'
import { getGeoData } from '@/apps/world-map/entities/map-geo-data/mapGeoData'
import { getCountryDisplayName } from '@/apps/world-map/dumb/mapProjection'
import { toLocalDayKey } from '@/shared/activity/dayBoundary'
import StatsPanel from '@/shared/stats/StatsPanel.vue'

const STATE_LABELS: Record<State, string> = {
  [State.New]: 'New',
  [State.Learning]: 'Learning',
  [State.Review]: 'Review',
  [State.Relearning]: 'Relearning'
}

const STATE_BADGE_CLASSES: Record<State, string> = {
  [State.New]: 'badge-neutral',
  [State.Learning]: 'badge-info',
  [State.Review]: 'badge-success',
  [State.Relearning]: 'badge-warning'
}

type CountryRow = {
  country: string
  name: string
  state: State
  retrievabilityPercent: number
  stabilityDays: number | null
}

const stats = ref<{ label: string; value: string | number }[]>([])
const countryRows = ref<CountryRow[]>([])

onMounted(async () => {
  const [progressRows, events, geoData] = await Promise.all([
    appDb.countryProgress.toArray(),
    appDb.learningEvents.toArray(),
    getGeoData()
  ])

  const today = toLocalDayKey(new Date().toISOString())
  const attemptsToday = events.filter((event) => toLocalDayKey(event.timestamp) === today).length

  stats.value = [
    { label: 'Countries practiced', value: progressRows.length },
    { label: 'Attempts today', value: attemptsToday },
    { label: 'Total attempts', value: events.length }
  ]

  const now = new Date()
  countryRows.value = progressRows
    .map((row) => ({
      country: row.country,
      name: getCountryDisplayName(geoData, row.country),
      state: row.state,
      retrievabilityPercent: Math.round(getRetrievability(row, now) * 100),
      stabilityDays: row.stability > 1 ? Math.round(row.stability) : null
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <StatsPanel :stats="stats" />

    <div
      v-if="countryRows.length > 0"
      class="overflow-x-auto"
    >
      <table class="table table-sm">
        <thead>
          <tr>
            <th>Country</th>
            <th>State</th>
            <th class="text-right">
              Retrievability
            </th>
            <th class="text-right">
              Stability
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in countryRows"
            :key="row.country"
          >
            <td>{{ row.name }}</td>
            <td>
              <span
                class="badge badge-sm"
                :class="STATE_BADGE_CLASSES[row.state]"
              >
                {{ STATE_LABELS[row.state] }}
              </span>
            </td>
            <td class="text-right">
              {{ row.retrievabilityPercent }}%
            </td>
            <td class="text-right">
              {{ row.stabilityDays ? `${row.stabilityDays}d` : '—' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
