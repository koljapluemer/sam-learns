<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getTotalActiveTimeMs, getTotalTrialCount } from '@/shared/activity/activityQueries'
import { formatDuration } from '@/shared/stats/formatDuration'
import StatsPanel from '@/shared/stats/StatsPanel.vue'
import GlobalStatsSection from '@/shared/stats/GlobalStatsSection.vue'
import { getAllTrials, RECENT_TRIAL_COUNT } from '../../entities/trial/trialRepository'
import PointCloudChart from '../../dumb/PointCloudChart.vue'
import type { TrialRow } from '../../db/appDb'
import PageShell from '@/shared/shell/PageShell.vue'

const stats = ref<{ label: string; value: string | number }[]>([])
const trials = ref<TrialRow[]>([])
const viewMode = ref<'recent' | 'all'>('recent')

const visibleValues = computed(() => {
  const values = trials.value.map((trial) => trial.missedByPercent)
  return viewMode.value === 'recent' ? values.slice(-RECENT_TRIAL_COUNT) : values
})

onMounted(async () => {
  const [timeMs, trialCount, allTrials] = await Promise.all([
    getTotalActiveTimeMs('currency-conversion-practice'),
    getTotalTrialCount('currency-conversion-practice'),
    getAllTrials()
  ])

  stats.value = [
    { label: 'Time spent', value: formatDuration(timeMs) },
    { label: 'Estimation exercises done', value: trialCount }
  ]
  trials.value = allTrials
})
</script>

<template>
  <PageShell title="Stats">
    <StatsPanel :stats="stats" />

    <div
      v-if="trials.length > 0"
      class="card border border-base-300 bg-base-100 shadow-sm"
    >
      <div class="card-body gap-4 p-4">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-lg font-semibold">
            Missed-by %
          </h2>
          <div class="join">
            <button
              type="button"
              class="btn btn-sm join-item"
              :class="{ 'btn-active': viewMode === 'recent' }"
              @click="viewMode = 'recent'"
            >
              Recent
            </button>
            <button
              type="button"
              class="btn btn-sm join-item"
              :class="{ 'btn-active': viewMode === 'all' }"
              @click="viewMode = 'all'"
            >
              All trials
            </button>
          </div>
        </div>
        <PointCloudChart :values="visibleValues" />
      </div>
    </div>

    <GlobalStatsSection />
  </PageShell>
</template>
