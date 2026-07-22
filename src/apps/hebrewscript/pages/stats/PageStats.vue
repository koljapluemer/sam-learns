<script setup lang="ts">
// Ported from linguanodon's hebrewscript js/stats.js + app/matrix.js +
// app/pairHistoryModal.js, rewritten as a reactive Vue page instead of
// manual DOM building. Everything is still computed client-side from this
// app's own Dexie event log - no server sync.
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import {
  importPracticeExportSnapshot,
  listPracticeEvents,
  readPracticeExportSnapshot
} from '../../app/practiceEvents'
import { getAccuracyTrialSeries, getPairAccuracyTrialSeries, getPracticeStatsSnapshot } from '../../app/stats'
import {
  createAccuracyTrendChart,
  createDailyAccuracyChart,
  createDailyVolumeChart,
  createPairHistoryChart,
  getChartMinWidth
} from '../../app/charts'
import { formatEffectiveAttempts, formatPercent, getCellStyle, getTooltip } from '../../app/matrixDisplay'
import type { PracticeEvent, PracticePairTarget } from '../../app/types'

const loading = ref(true)
const loadError = ref('')
const events = ref<PracticeEvent[]>([])

const snapshot = computed(() => (events.value.length ? getPracticeStatsSnapshot(events.value) : null))
const accuracyTrials = computed(() => getAccuracyTrialSeries(events.value))

const matrixData = computed(() => {
  if (!snapshot.value) return null
  const rows = snapshot.value.letter.rows
  const columnKeys = rows[0]?.cells.map((cell) => cell.distractorKey) ?? []
  const visibleCells = rows.flatMap((row) =>
    row.cells.filter((cell) => cell.correctKey !== cell.distractorKey && cell.decayedPosteriorAccuracy !== null)
  )
  const attempts = visibleCells.reduce((total, cell) => total + cell.attempts, 0)
  const distinctPairs = visibleCells.length

  const topPairs = [...visibleCells]
    .filter((cell) => cell.attempts >= 3)
    .sort((left, right) => {
      if (left.decayedPosteriorAccuracy !== right.decayedPosteriorAccuracy) {
        return (left.decayedPosteriorAccuracy ?? 0) - (right.decayedPosteriorAccuracy ?? 0)
      }
      if (left.effectiveAttempts !== right.effectiveAttempts) return right.effectiveAttempts - left.effectiveAttempts
      return right.attempts - left.attempts
    })
    .slice(0, 5)

  return {
    rows,
    columnKeys,
    attempts,
    distinctPairs,
    topPairs,
    weightedAccuracy: snapshot.value.letter.decayedPosteriorAccuracy
  }
})

const dailyVolumeCanvas = ref<HTMLCanvasElement | null>(null)
const dailyAccuracyCanvas = ref<HTMLCanvasElement | null>(null)
const accuracyTrendCanvas = ref<HTMLCanvasElement | null>(null)
const dailyVolumeMinWidth = ref('')
const dailyAccuracyMinWidth = ref('')
const dailyVolumeSummary = ref('')
const dailyAccuracySummary = ref('')
const trendRange = ref<'recent' | 'all'>('recent')

let dailyVolumeChart: ReturnType<typeof createDailyVolumeChart> | null = null
let dailyAccuracyChart: ReturnType<typeof createDailyAccuracyChart> | null = null
let accuracyTrendChart: ReturnType<typeof createAccuracyTrendChart> | null = null

const trendSummary = computed(() => {
  if (!snapshot.value || snapshot.value.overview.totalExercises === 0) return ''
  return trendRange.value === 'recent'
    ? `Last ${Math.min(accuracyTrials.value.length, 100)} trials`
    : `${accuracyTrials.value.length} total trials`
})

function setTrendRange(range: 'recent' | 'all'): void {
  trendRange.value = range
  accuracyTrendChart?.setRange(range)
}

async function loadStats(): Promise<void> {
  try {
    events.value = await listPracticeEvents()
  } catch {
    loadError.value = 'Could not load stats.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadStats()
})

watch(
  snapshot,
  (value) => {
    dailyVolumeChart?.chart.destroy()
    dailyAccuracyChart?.chart.destroy()
    dailyVolumeChart = null
    dailyAccuracyChart = null
    accuracyTrendChart = null

    if (!value || value.overview.totalExercises === 0) return

    if (dailyVolumeCanvas.value) {
      dailyVolumeChart = createDailyVolumeChart(dailyVolumeCanvas.value, value.dailyExercises)
      dailyVolumeMinWidth.value = getChartMinWidth(dailyVolumeChart.completeDays.length)
      dailyVolumeSummary.value = `${value.dailyExercises.length} active day${value.dailyExercises.length === 1 ? '' : 's'} over ${dailyVolumeChart.completeDays.length} day${dailyVolumeChart.completeDays.length === 1 ? '' : 's'}`
    }

    if (dailyAccuracyCanvas.value) {
      dailyAccuracyChart = createDailyAccuracyChart(dailyAccuracyCanvas.value, value.dailyAccuracy)
      dailyAccuracyMinWidth.value = getChartMinWidth(dailyAccuracyChart.completeDays.length)
      dailyAccuracySummary.value = `${value.dailyAccuracy.length} active day${value.dailyAccuracy.length === 1 ? '' : 's'} over ${dailyAccuracyChart.completeDays.length} day${dailyAccuracyChart.completeDays.length === 1 ? '' : 's'} · 95% Wilson CI`
    }

    if (accuracyTrendCanvas.value) {
      trendRange.value = 'recent'
      accuracyTrendChart = createAccuracyTrendChart(accuracyTrendCanvas.value, accuracyTrials.value)
    }
  },
  { flush: 'post' }
)

// Pair-history modal
const dialogRef = ref<HTMLDialogElement | null>(null)
const pairHistoryCanvas = ref<HTMLCanvasElement | null>(null)
const modalPairTarget = ref<PracticePairTarget | null>(null)
const modalTrials = computed(() => (modalPairTarget.value ? getPairAccuracyTrialSeries(events.value, modalPairTarget.value) : []))
const modalLabel = computed(() =>
  modalPairTarget.value ? `${modalPairTarget.value.correctKey} -> ${modalPairTarget.value.distractorKey}` : ''
)
const modalAccuracy = computed(() => {
  const trials = modalTrials.value
  return trials.length ? trials.filter((trial) => trial.isCorrect).length / trials.length : null
})
const modalLatestRolling10 = computed(() => modalTrials.value[modalTrials.value.length - 1]?.rolling10 ?? null)
let pairHistoryChart: ReturnType<typeof createPairHistoryChart> | null = null

async function openPairHistory(pairTarget: PracticePairTarget): Promise<void> {
  modalPairTarget.value = pairTarget
  await nextTick()

  if (modalTrials.value.length && pairHistoryCanvas.value) {
    pairHistoryChart?.destroy()
    pairHistoryChart = createPairHistoryChart(pairHistoryCanvas.value, modalTrials.value)
  }

  dialogRef.value?.showModal()
}

function handleDialogClose(): void {
  pairHistoryChart?.destroy()
  pairHistoryChart = null
  modalPairTarget.value = null
}

// Import/export tracked data
const importInputRef = ref<HTMLInputElement | null>(null)
const importBusy = ref(false)
const syncNotice = ref<{ tone: 'success' | 'error'; text: string } | null>(null)

async function handleExport(): Promise<void> {
  const payload = await readPracticeExportSnapshot()
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `hebrew-script-progress-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

function triggerImport(): void {
  importInputRef.value?.click()
}

async function handleImportChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  importBusy.value = true
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
    importBusy.value = false
  }
}
</script>

<template>
  <section class="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <h1 class="text-2xl font-semibold">
        Stats
      </h1>
      <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <input
          ref="importInputRef"
          type="file"
          accept="application/json,.json"
          class="hidden"
          @change="handleImportChange"
        >
        <button
          class="btn btn-outline btn-sm w-full sm:w-auto"
          :disabled="importBusy"
          @click="triggerImport"
        >
          Import tracked data JSON
        </button>
        <button
          class="btn btn-outline btn-sm w-full sm:w-auto"
          :disabled="importBusy"
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
      v-else-if="loadError"
      class="alert alert-error"
    >
      <span>{{ loadError }}</span>
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
              {{ Math.floor(snapshot.overview.totalListeningMs / 3600000) > 0
                ? `${Math.floor(snapshot.overview.totalListeningMs / 3600000)}h ${Math.floor((snapshot.overview.totalListeningMs % 3600000) / 60000)}m`
                : Math.floor(snapshot.overview.totalListeningMs / 60000) > 0
                  ? `${Math.floor(snapshot.overview.totalListeningMs / 60000)}m ${Math.floor((snapshot.overview.totalListeningMs % 60000) / 1000)}s`
                  : `${Math.floor(snapshot.overview.totalListeningMs / 1000)}s` }}
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
            <span class="text-sm text-base-content/70">{{ trendSummary }}</span>
            <div class="join">
              <button
                type="button"
                class="btn btn-sm join-item"
                :class="{ 'btn-active': trendRange === 'recent' }"
                @click="setTrendRange('recent')"
              >
                Last 100
              </button>
              <button
                type="button"
                class="btn btn-sm join-item"
                :class="{ 'btn-active': trendRange === 'all' }"
                @click="setTrendRange('all')"
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
        v-if="matrixData && snapshot.letter.attempts > 0"
        class="space-y-4"
      >
        <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div class="max-w-2xl space-y-1">
            <h2 class="text-lg font-semibold">
              Letter confusions
            </h2>
            <p class="text-sm text-base-content/70">
              Rows are the correct answer. Columns are the distractor shown alongside it.
            </p>
            <p class="text-sm text-base-content/70">
              Each cell shows a recency-weighted Bayesian accuracy estimate for that direction. The smaller number
              underneath is the effective attempt count after discounting older results.
            </p>
          </div>
          <div class="stats stats-vertical border border-base-300 bg-base-100 shadow-sm sm:stats-horizontal">
            <div class="stat px-4 py-3">
              <div class="stat-title text-xs">
                Weighted accuracy
              </div>
              <div class="stat-value text-xl">
                {{ formatPercent(matrixData.weightedAccuracy) }}
              </div>
            </div>
            <div class="stat px-4 py-3">
              <div class="stat-title text-xs">
                Attempts
              </div>
              <div class="stat-value text-xl">
                {{ matrixData.attempts }}
              </div>
            </div>
            <div class="stat px-4 py-3">
              <div class="stat-title text-xs">
                Directions
              </div>
              <div class="stat-value text-xl">
                {{ matrixData.distinctPairs }}
              </div>
            </div>
          </div>
        </div>

        <div class="overflow-x-auto overflow-y-hidden rounded-box border border-base-300 bg-base-100 p-3">
          <div
            class="grid w-fit min-w-full gap-2 text-center text-xs sm:text-sm"
            :style="{ gridTemplateColumns: `max-content repeat(${matrixData.columnKeys.length}, minmax(4.5rem, 1fr))` }"
          >
            <div class="sticky left-0 z-10 rounded-box bg-base-100 p-2" />
            <div
              v-for="columnKey in matrixData.columnKeys"
              :key="'col-' + columnKey"
              class="flex items-center justify-center rounded-box bg-base-200 p-2 font-medium"
            >
              {{ columnKey }}
            </div>

            <template
              v-for="row in matrixData.rows"
              :key="'row-' + row.key"
            >
              <div class="sticky left-0 z-10 flex items-center rounded-box bg-base-200 p-2 font-medium">
                {{ row.key }}
              </div>
              <button
                v-for="cell in row.cells"
                :key="row.key + '-' + cell.distractorKey"
                type="button"
                class="tooltip tooltip-bottom min-h-20 rounded-box border p-2"
                :class="cell.correctKey === cell.distractorKey || cell.attempts === 0
                  ? 'cursor-default border-base-300 bg-base-200/60 text-base-content/40'
                  : 'cursor-pointer border-base-300 bg-base-100'"
                :style="getCellStyle(cell)"
                :data-tip="getTooltip(cell, (key) => key)"
                :disabled="cell.correctKey === cell.distractorKey || cell.attempts === 0"
                @click="openPairHistory({ correctKey: cell.correctKey, distractorKey: cell.distractorKey })"
              >
                <div class="flex h-full flex-col items-center justify-center gap-1">
                  <span class="text-sm font-semibold sm:text-base">{{ formatPercent(cell.decayedPosteriorAccuracy) }}</span>
                  <span class="text-[11px] text-base-content/70">eff {{ formatEffectiveAttempts(cell.effectiveAttempts) }}</span>
                </div>
              </button>
            </template>
          </div>
        </div>

        <div class="rounded-box border border-base-300 bg-base-100 p-4">
          <h3 class="text-sm font-semibold">
            Hardest pairs
          </h3>
          <div
            v-if="matrixData.topPairs.length"
            class="mt-3 grid gap-2"
          >
            <button
              v-for="pair in matrixData.topPairs"
              :key="pair.correctKey + '-' + pair.distractorKey"
              type="button"
              class="flex items-center justify-between gap-3 rounded-box bg-base-200 px-3 py-2 text-left text-sm transition hover:bg-base-300"
              @click="openPairHistory({ correctKey: pair.correctKey, distractorKey: pair.distractorKey })"
            >
              <span>{{ pair.correctKey }} -> {{ pair.distractorKey }}</span>
              <span class="text-base-content/70">{{ formatPercent(pair.decayedPosteriorAccuracy) }} · eff {{ formatEffectiveAttempts(pair.effectiveAttempts) }}</span>
            </button>
          </div>
          <p
            v-else
            class="mt-3 text-sm text-base-content/70"
          >
            More tracked attempts are needed before pair rankings become useful.
          </p>
        </div>
      </div>
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

    <dialog
      ref="dialogRef"
      class="modal"
      @close="handleDialogClose"
    >
      <div class="modal-box max-w-4xl">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 class="text-lg font-semibold">
              {{ modalLabel }}
            </h2>
            <p class="text-sm text-base-content/70">
              Correct target against this distractor, by attempt order
            </p>
          </div>
        </div>
        <div class="stats stats-vertical mt-4 w-full border border-base-300 bg-base-200 shadow-sm sm:stats-horizontal">
          <div class="stat px-4 py-3">
            <div class="stat-title text-xs">
              Accuracy
            </div>
            <div class="stat-value text-xl">
              {{ formatPercent(modalAccuracy) }}
            </div>
          </div>
          <div class="stat px-4 py-3">
            <div class="stat-title text-xs">
              Rolling 10
            </div>
            <div class="stat-value text-xl">
              {{ formatPercent(modalLatestRolling10) }}
            </div>
          </div>
          <div class="stat px-4 py-3">
            <div class="stat-title text-xs">
              Attempts
            </div>
            <div class="stat-value text-xl">
              {{ modalTrials.length }}
            </div>
          </div>
        </div>
        <div
          v-if="modalTrials.length"
          class="mt-4"
        >
          <div class="mb-2 text-sm text-base-content/70">
            {{ modalTrials.length }} total attempts
          </div>
          <div class="h-80">
            <canvas ref="pairHistoryCanvas" />
          </div>
        </div>
        <p
          v-else
          class="mt-4 text-sm text-base-content/70"
        >
          No tracked attempts for this pair.
        </p>
        <div class="modal-action">
          <form method="dialog">
            <button class="btn">
              Close
            </button>
          </form>
        </div>
      </div>
      <form
        method="dialog"
        class="modal-backdrop"
      >
        <button>close</button>
      </form>
    </dialog>
  </section>
</template>
