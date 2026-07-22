<script setup lang="ts">
// Ported from linguanodon's viettonepractice static/viettonepractice/js/stats.js.
// Everything is computed client-side from this browser's own Dexie event
// log, matching the source app - no server round-trip. The daily-volume/
// accuracy charts and the confusion matrix stay imperative DOM builders
// (createDailyVolumeChart/createDailyAccuracyChart/renderMatrix/
// createPairHistoryModal), called from onMounted, same shape as the
// original; the surrounding page chrome is real Vue template/reactivity.
import { nextTick, onMounted, ref, useTemplateRef } from 'vue'
import {
  importPracticeExportSnapshot,
  listPracticeEvents,
  readPracticeExportSnapshot
} from '../../app/practiceEvents'
import { getAccuracyTrialSeries, getPairAccuracyTrialSeries, getPracticeStatsSnapshot } from '../../app/stats'
import { createAccuracyTrendChart, createDailyAccuracyChart, createDailyVolumeChart } from '../../app/charts'
import { getChartMinWidth } from '../../app/dailyChart'
import { renderMatrix } from '../../app/matrixRenderer'
import { createPairHistoryModal } from '../../app/pairHistoryModal'
import type { PracticeEvent, PracticeStatsSnapshot } from '../../app/types'

const TONE_LABELS: Record<string, string> = {
  ngang: 'ngang | -',
  huyen: 'huyền | `',
  sac: 'sắc | /',
  hoi: 'hỏi | ?',
  nga: 'ngã | ~',
  nang: 'nặng | .'
}

const formatToneKey = (key: string): string => TONE_LABELS[key] ?? key

function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

const loading = ref(true)
const loadFailed = ref(false)
const snapshot = ref<PracticeStatsSnapshot | null>(null)
const dailyVolumeSummary = ref('')
const dailyAccuracySummary = ref('')
const accuracyTrendSummary = ref('')
const accuracyRange = ref<'recent' | 'all'>('recent')
const dailyVolumeMinWidth = ref('320px')
const dailyAccuracyMinWidth = ref('320px')
const syncNotice = ref<{ tone: 'success' | 'error'; text: string } | null>(null)
const importing = ref(false)

let latestEvents: PracticeEvent[] = []
let trendChart: ReturnType<typeof createAccuracyTrendChart> | null = null
let pairHistoryModal: ReturnType<typeof createPairHistoryModal> | null = null

const dailyVolumeCanvas = useTemplateRef<HTMLCanvasElement>('dailyVolumeCanvas')
const dailyAccuracyCanvas = useTemplateRef<HTMLCanvasElement>('dailyAccuracyCanvas')
const accuracyTrendCanvas = useTemplateRef<HTMLCanvasElement>('accuracyTrendCanvas')
const matrixSection = useTemplateRef<HTMLDivElement>('matrixSection')
const modalContainer = useTemplateRef<HTMLDivElement>('modalContainer')
const importInput = useTemplateRef<HTMLInputElement>('importInput')

function updateAccuracyTrendSummary() {
  if (!trendChart) return
  const trials = getAccuracyTrialSeries(latestEvents)
  accuracyTrendSummary.value =
    trendChart.getRange() === 'recent' ? `Last ${Math.min(trials.length, 100)} trials` : `${trials.length} total trials`
}

function renderStats() {
  if (!modalContainer.value) return

  const currentSnapshot = getPracticeStatsSnapshot(latestEvents)
  snapshot.value = currentSnapshot

  if (currentSnapshot.overview.totalExercises === 0) return

  if (!pairHistoryModal) {
    pairHistoryModal = createPairHistoryModal(modalContainer.value, {
      getTrials: (pairTarget) => getPairAccuracyTrialSeries(latestEvents, pairTarget),
      formatKey: formatToneKey
    })
  }

  if (dailyVolumeCanvas.value) {
    const { completeDays: volumeDays } = createDailyVolumeChart(dailyVolumeCanvas.value, currentSnapshot.dailyExercises)
    dailyVolumeMinWidth.value = getChartMinWidth(volumeDays.length)
    dailyVolumeSummary.value = `${currentSnapshot.dailyExercises.length} active day${currentSnapshot.dailyExercises.length === 1 ? '' : 's'} over ${volumeDays.length} day${volumeDays.length === 1 ? '' : 's'}`
  }

  if (dailyAccuracyCanvas.value) {
    const { completeDays: accuracyDays } = createDailyAccuracyChart(dailyAccuracyCanvas.value, currentSnapshot.dailyAccuracy)
    dailyAccuracyMinWidth.value = getChartMinWidth(accuracyDays.length)
    dailyAccuracySummary.value = `${currentSnapshot.dailyAccuracy.length} active day${currentSnapshot.dailyAccuracy.length === 1 ? '' : 's'} over ${accuracyDays.length} day${accuracyDays.length === 1 ? '' : 's'} · 95% Wilson CI`
  }

  if (accuracyTrendCanvas.value) {
    const accuracyTrials = getAccuracyTrialSeries(latestEvents)
    trendChart = createAccuracyTrendChart(accuracyTrendCanvas.value, accuracyTrials)
    updateAccuracyTrendSummary()
  }

  if (matrixSection.value && currentSnapshot.tone.attempts > 0) {
    renderMatrix(matrixSection.value, {
      title: 'Tone confusions',
      summary: currentSnapshot.tone,
      formatKey: formatToneKey,
      onSelectPair: (pairTarget) => pairHistoryModal?.open(pairTarget)
    })
  }
}

function setAccuracyRange(range: 'recent' | 'all') {
  accuracyRange.value = range
  trendChart?.setRange(range)
  updateAccuracyTrendSummary()
}

async function loadStats() {
  loading.value = true
  loadFailed.value = false
  try {
    latestEvents = await listPracticeEvents()
    loading.value = false
    await nextTick()
    renderStats()
  } catch {
    loading.value = false
    loadFailed.value = true
  }
}

async function handleExport() {
  const payload = await readPracticeExportSnapshot()
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `viet-tone-practice-progress-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

function triggerImport() {
  importInput.value?.click()
}

async function handleImportChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  importing.value = true
  syncNotice.value = null

  try {
    const fileContent = await file.text()
    const importResult = await importPracticeExportSnapshot(JSON.parse(fileContent))
    await loadStats()
    syncNotice.value = {
      tone: 'success',
      text:
        importResult.importedCount > 0
          ? `Imported ${importResult.importedCount} events. Skipped ${importResult.skippedCount}.`
          : `No new events. Skipped ${importResult.skippedCount} duplicates.`
    }
  } catch (error) {
    syncNotice.value = { tone: 'error', text: error instanceof Error ? error.message : 'Could not import tracked data.' }
  } finally {
    importing.value = false
  }
}

onMounted(() => {
  void loadStats()
})
</script>

<template>
  <div class="p-4">
    <section class="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 class="text-2xl font-semibold">
          Stats
        </h1>
        <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <input
            ref="importInput"
            type="file"
            accept="application/json,.json"
            class="hidden"
            @change="handleImportChange"
          >
          <button
            class="btn btn-outline btn-sm w-full sm:w-auto"
            :disabled="importing"
            @click="triggerImport"
          >
            Import tracked data JSON
          </button>
          <button
            class="btn btn-outline btn-sm w-full sm:w-auto"
            :disabled="importing"
            @click="handleExport"
          >
            Export tracked data JSON
          </button>
        </div>
      </div>

      <div
        v-if="syncNotice"
        class="alert"
        :class="syncNotice.tone === 'success' ? 'alert-success' : 'alert-error'"
      >
        <span>{{ syncNotice.text }}</span>
      </div>

      <div
        v-if="loading"
        class="flex min-h-64 items-center justify-center rounded-box border border-base-300 bg-base-100"
      >
        <span class="loading loading-spinner loading-lg" />
      </div>

      <div
        v-else-if="loadFailed"
        class="alert alert-error"
      >
        <span>Could not load stats.</span>
      </div>

      <div
        v-else-if="!snapshot || snapshot.overview.totalExercises === 0"
        class="rounded-box border border-base-300 bg-base-100 p-6"
      >
        <h2 class="text-lg font-semibold">
          No tracked stats yet
        </h2>
      </div>

      <div
        v-else
        class="flex flex-col gap-6"
      >
        <section class="rounded-box border border-base-300 bg-base-100 p-4">
          <div class="stats stats-vertical w-full border border-base-300 bg-base-200 shadow-sm sm:stats-horizontal">
            <div class="stat">
              <div class="stat-title">
                Exercises completed
              </div>
              <div class="stat-value text-primary">
                {{ snapshot.overview.totalExercises }}
              </div>
            </div>
            <div class="stat">
              <div class="stat-title">
                Audio listening time
              </div>
              <div class="stat-value text-secondary">
                {{ formatDuration(snapshot.overview.totalListeningMs) }}
              </div>
            </div>
          </div>
        </section>

        <section class="rounded-box border border-base-300 bg-base-100 p-4">
          <div class="mb-4 flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold">
              Exercises per day
            </h2>
            <span class="text-sm text-base-content/70">{{ dailyVolumeSummary }}</span>
          </div>
          <div class="overflow-x-auto">
            <div
              class="h-72"
              :style="{ minWidth: dailyVolumeMinWidth }"
            >
              <canvas ref="dailyVolumeCanvas" />
            </div>
          </div>
        </section>

        <section class="rounded-box border border-base-300 bg-base-100 p-4">
          <div class="mb-4 flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold">
              Accuracy per day
            </h2>
            <span class="text-sm text-base-content/70">{{ dailyAccuracySummary }}</span>
          </div>
          <div class="overflow-x-auto">
            <div
              class="h-72"
              :style="{ minWidth: dailyAccuracyMinWidth }"
            >
              <canvas ref="dailyAccuracyCanvas" />
            </div>
          </div>
        </section>

        <section class="rounded-box border border-base-300 bg-base-100 p-4">
          <div class="mb-4 flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold">
              Accuracy over time
            </h2>
            <div class="flex items-center gap-3">
              <span class="text-sm text-base-content/70">{{ accuracyTrendSummary }}</span>
              <div class="join">
                <button
                  type="button"
                  class="btn btn-sm join-item"
                  :class="{ 'btn-active': accuracyRange === 'recent' }"
                  @click="setAccuracyRange('recent')"
                >
                  Last 100
                </button>
                <button
                  type="button"
                  class="btn btn-sm join-item"
                  :class="{ 'btn-active': accuracyRange === 'all' }"
                  @click="setAccuracyRange('all')"
                >
                  All-time
                </button>
              </div>
            </div>
          </div>
          <div class="h-80">
            <canvas ref="accuracyTrendCanvas" />
          </div>
        </section>

        <div
          v-if="snapshot.tone.attempts > 0"
          ref="matrixSection"
        />
        <div
          v-else
          class="rounded-box border border-base-300 bg-base-100 p-6"
        >
          <h2 class="text-lg font-semibold">
            Confusion stats need newer attempts
          </h2>
          <p class="mt-2 text-sm text-base-content/70">
            Exercise totals and listening time are available, but the confusion matrix only populates from
            analytics-enabled attempts.
          </p>
        </div>
      </div>

      <div ref="modalContainer" />
    </section>
  </div>
</template>
