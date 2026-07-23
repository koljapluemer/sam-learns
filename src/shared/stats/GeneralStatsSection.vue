<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { activityDb, type ActivityEventRow } from '@/shared/activity/activityDb'
import { toLocalDayKey } from '@/shared/activity/dayBoundary'
import { apps } from '@/appRegistry'

const DAYS_TO_SHOW = 30

const events = ref<ActivityEventRow[]>([])

onMounted(async () => {
  events.value = await activityDb.activityEvents.toArray()
})

const appNameBySlug = computed(() => {
  const map = new Map<string, string>()
  for (const app of apps) {
    map.set(app.slug, app.name)
  }
  return map
})

type DayRow = { day: string; counts: { appSlug: string; appName: string; count: number }[] }

const dailyUsage = computed<DayRow[]>(() => {
  const byDay = new Map<string, Map<string, number>>()

  for (const event of events.value) {
    const day = toLocalDayKey(event.timestamp)
    if (!byDay.has(day)) {
      byDay.set(day, new Map())
    }
    const byApp = byDay.get(day)!
    byApp.set(event.appSlug, (byApp.get(event.appSlug) ?? 0) + 1)
  }

  return Array.from(byDay.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, DAYS_TO_SHOW)
    .map(([day, byApp]) => ({
      day,
      counts: Array.from(byApp.entries())
        .map(([appSlug, count]) => ({ appSlug, appName: appNameBySlug.value.get(appSlug) ?? appSlug, count }))
        .sort((a, b) => b.count - a.count)
    }))
})
</script>

<template>
  <section class="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
    <header class="space-y-2">
      <h1 class="text-3xl font-semibold">
        Daily Usage
      </h1>
      <p class="max-w-2xl text-sm text-base-content/70">
        Counts are stored only on this device/browser — there's no account, so this won't match
        across devices.
      </p>
    </header>

    <div
      v-if="dailyUsage.length === 0"
      class="rounded-box border border-base-300 bg-base-100 p-10 text-center text-sm text-base-content/70"
    >
      No activity recorded yet. Do a few exercises in any app to see stats here.
    </div>

    <div
      v-else
      class="overflow-x-auto"
    >
      <table class="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>App</th>
            <th class="text-right">
              Attempts
            </th>
          </tr>
        </thead>
        <tbody>
          <template
            v-for="row in dailyUsage"
            :key="row.day"
          >
            <tr
              v-for="(entry, index) in row.counts"
              :key="row.day + entry.appSlug"
            >
              <td>{{ index === 0 ? row.day : '' }}</td>
              <td>{{ entry.appName }}</td>
              <td class="text-right">
                {{ entry.count }}
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </section>
</template>
