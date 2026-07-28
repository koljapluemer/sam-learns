<script setup lang="ts">
// Port of linguanodon's tprboard stats-page.js - a read-only view of the
// localStorage-backed player stats from app/stats.ts.
import { formatPlayedTime, readPlayerStats } from '../../app/stats'
import GlobalStatsSection from '@/shared/stats/GlobalStatsSection.vue'
import PageShell from '@/shared/shell/PageShell.vue'

const stats = readPlayerStats()
</script>

<template>
  <PageShell title="Stats">
    <div class="stats stats-vertical w-full border border-base-300 bg-base-100 shadow-sm">
      <div class="stat">
        <div class="stat-title">
          Time played
        </div>
        <div class="stat-value text-primary">
          {{ formatPlayedTime(stats.timePlayedMs) }}
        </div>
      </div>
      <div class="stat">
        <div class="stat-title">
          Tasks completed
        </div>
        <div class="stat-value">
          {{ stats.tasksCompleted }}
        </div>
      </div>
      <div class="stat">
        <div class="stat-title">
          Best streak
        </div>
        <div class="stat-value">
          {{ stats.bestStreak }}
        </div>
      </div>
    </div>

    <GlobalStatsSection />
  </PageShell>
</template>
