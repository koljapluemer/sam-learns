<script setup lang="ts">
// Port of linguanodon's tprboard main.js + app/layout.js. layout.js's
// innerHTML-based DOM construction becomes a real <template> here; main.js's
// plain `state` object + manual DOM-write functions (updateStreakView,
// updateLanguageButtons, syncLanguageModalState) become refs/computeds
// driving that template instead. The BoardScene class itself is still
// mounted/driven imperatively (see boardScene.ts) since Three.js owns its
// own render loop independent of Vue's reactivity.
//
// queueEvent/queueState/trackActiveTime/pullState/mergeRemoteState are
// dropped - no server sync in this repo (see docs/linguanodon-import.md).
// recordCompletedRound (learningStore.ts) calls logActivity('tprboard')
// itself, so no extra activity-log call is needed here.
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Flame, Volume2 } from 'lucide-vue-next'
import { BoardScene } from '../../app/boardScene'
import { loadLanguageOptions, loadLocaleTaskMap, loadObjectPool } from '../../app/data'
import { loadLearningSnapshot, recordCompletedRound } from '../../app/learningStore'
import { createStatsTracker, type PlayerStats } from '../../app/stats'
import { createRelationshipIndex, planRound } from '../../app/tasks'
import { useLocalSetting } from '@/shared/settings/useLocalSetting'
import type { LanguageOption, LocaleTaskMap, PlacedObject, RelationshipIndex, RoundPlan, RoundSelectionMode, TaskCandidate } from '../../app/types'

const MODELS_BASE_URL = '/data/tprboard/models/'
const AUDIO_BASE_URL = '/data/tprboard/audio/'
const ROUND_SUCCESS_DELAY_MS = 600

const sceneRootEl = ref<HTMLDivElement | null>(null)
const languageModalEl = ref<HTMLDialogElement | null>(null)

const selectedLanguageCode = useLocalSetting<string | null>('tprboard-language-code', null)
const languageOptions = ref<LanguageOption[]>([])
const objectPool = ref<PlacedObject[]>([])
const relationshipIndex = ref<RelationshipIndex | null>(null)

const activeTask = ref<TaskCandidate | null>(null)
const taskText = ref('Loading…')
const taskSuccess = ref(false)
const replayAvailable = ref(false)
const stats = ref<PlayerStats>({ bestStreak: 0, currentStreak: 0, recordStreakBaseline: 0, tasksCompleted: 0, timePlayedMs: 0 })

let boardScene: BoardScene | null = null
let statsTracker: ReturnType<typeof createStatsTracker> | null = null
let unsubscribeStats: (() => void) | null = null

let localeTaskMap: LocaleTaskMap = {}
let placedObjects: PlacedObject[] = []
let isTransitioningRound = false
let attemptCount = 0
let boardDifficulty = 0
let hadWrongAttempt = false
let roundSelectionMode: RoundSelectionMode = 'random'

const audioElement = new Audio()
audioElement.preload = 'auto'
const audioAvailabilityByUrl = new Map<string, Promise<boolean>>()
let audioSyncToken = 0
let replayUrl: string | null = null

const hasSelectedLanguage = computed(() => selectedLanguageCode.value !== null)

const isRecordRun = computed(() => stats.value.currentStreak > 0 && stats.value.currentStreak > stats.value.recordStreakBaseline)

const streakIndicatorClass = computed(() => (isRecordRun.value ? 'text-success' : 'text-base-content/70'))
const streakIconClass = computed(() => (isRecordRun.value ? 'text-success' : 'text-warning'))

const streakBarCurrentFillClass = computed(() => {
  if (stats.value.currentStreak === 0) return 'bg-warning/70'
  return isRecordRun.value ? 'bg-success/70' : 'bg-warning/70'
})
const streakBarRecordFillClass = computed(() => {
  if (stats.value.currentStreak === 0) return 'bg-transparent'
  return isRecordRun.value ? 'bg-warning/65' : 'bg-transparent'
})
const streakBarCurrentFillWidth = computed(() => {
  const { currentStreak, bestStreak } = stats.value

  if (currentStreak === 0) return '0%'

  if (isRecordRun.value) return '100%'

  const recordRatio = bestStreak > 0 ? Math.min(currentStreak / bestStreak, 1) : 0
  return `${recordRatio * 100}%`
})
const streakBarRecordFillWidth = computed(() => {
  const { currentStreak, recordStreakBaseline } = stats.value

  if (currentStreak === 0 || !isRecordRun.value) return '0%'

  const baselineRatio = recordStreakBaseline > 0 ? Math.min(recordStreakBaseline / currentStreak, 1) : 0
  return `${baselineRatio * 100}%`
})
const streakTitle = computed(() => {
  const { bestStreak, currentStreak, recordStreakBaseline } = stats.value

  if (currentStreak === 0) {
    return bestStreak > 0 ? `Current streak: 0. Record: ${bestStreak}.` : 'Current streak: 0.'
  }

  if (isRecordRun.value) {
    return `Current streak: ${currentStreak}. Previous record: ${recordStreakBaseline}.`
  }

  return `Current streak: ${currentStreak}. Record: ${bestStreak}.`
})

const currentLanguageText = computed(() => {
  const selected = languageOptions.value.find((option) => option.code === selectedLanguageCode.value)
  return selected ? `Current: ${selected.name}` : 'Choose a language to start playing.'
})

function openLanguageModal(): void {
  if (languageModalEl.value && !languageModalEl.value.open) {
    languageModalEl.value.showModal()
  }
}

function handleModalCancel(event: Event): void {
  if (!hasSelectedLanguage.value) {
    event.preventDefault()
  }
}

function handleModalClose(): void {
  if (!hasSelectedLanguage.value) {
    openLanguageModal()
  }
}

function buildTaskAudioUrl(task: TaskCandidate, languageCode: string): string {
  return `${AUDIO_BASE_URL}${languageCode}/${task.key}-${task.textIndex + 1}.mp3`
}

function stopTaskAudio(): void {
  audioElement.pause()
  audioElement.currentTime = 0
}

function setTaskReplayAvailability(url: string | null): void {
  replayUrl = url
  replayAvailable.value = url !== null
}

async function checkTaskAudioExists(url: string): Promise<boolean> {
  const headResponse = await fetch(url, { method: 'HEAD' })

  if (headResponse.ok) return true

  if (headResponse.status !== 405 && headResponse.status !== 501) return false

  const getResponse = await fetch(url)
  return getResponse.ok
}

function resolveTaskAudioAvailability(url: string): Promise<boolean> {
  const cached = audioAvailabilityByUrl.get(url)

  if (cached) return cached

  const availabilityPromise = checkTaskAudioExists(url).catch(() => false)
  audioAvailabilityByUrl.set(url, availabilityPromise)
  return availabilityPromise
}

async function replayTaskAudio(): Promise<void> {
  if (!replayUrl) return

  stopTaskAudio()

  if (audioElement.src !== new URL(replayUrl, window.location.href).href) {
    audioElement.src = replayUrl
  }

  try {
    await audioElement.play()
  } catch {
    // Ignore autoplay or decoding failures.
  }
}

async function syncTaskAudio(task: TaskCandidate | null): Promise<void> {
  const syncToken = ++audioSyncToken

  stopTaskAudio()
  setTaskReplayAvailability(null)

  if (!task || !selectedLanguageCode.value) return

  const audioUrl = buildTaskAudioUrl(task, selectedLanguageCode.value)
  const audioExists = await resolveTaskAudioAvailability(audioUrl)

  if (syncToken !== audioSyncToken || !audioExists) return

  setTaskReplayAvailability(audioUrl)
  await replayTaskAudio()
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function logRoundPlan(roundPlan: RoundPlan, languageCode: string): void {
  const comparator = roundPlan.difficultyTarget.kind === 'ceiling' ? '<' : '>'

  console.info('[round-planner] difficulty target', {
    languageCode,
    reason: roundPlan.difficultyTarget.reason,
    target: `${comparator} ${roundPlan.difficultyTarget.value}`
  })
  console.info('[round-planner] calculated difficulty', {
    actualDifficulty: roundPlan.difficulty,
    boardObjectNames: roundPlan.placedObjects.map(({ name }) => name),
    breakdown: roundPlan.difficultyBreakdown,
    taskKey: roundPlan.activeTask.key,
    reviewPredictedRecall: roundPlan.reviewPredictedRecall,
    selectionMode: roundPlan.selectionMode,
    textIndex: roundPlan.activeTask.textIndex
  })
}

function getRoundStartErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message === 'No locale-playable relationships were found.') {
    return 'No valid tasks are available for this language yet.'
  }

  return 'Unable to start a new round right now.'
}

async function showRoundStartError(error: unknown): Promise<void> {
  console.error('[round-start] failed to start round', error)

  activeTask.value = null
  attemptCount = 0
  boardDifficulty = 0
  hadWrongAttempt = false
  placedObjects = []
  roundSelectionMode = 'random'
  taskSuccess.value = false
  taskText.value = getRoundStartErrorMessage(error)
  boardScene?.setActiveTask(null)
  setTaskReplayAvailability(null)

  try {
    await boardScene?.initialize([])
  } catch (boardError) {
    console.error('[round-start] failed to clear board after round-start error', boardError)
  }
}

async function startNewRound(): Promise<void> {
  try {
    const languageCode = selectedLanguageCode.value

    if (!languageCode) return

    if (!relationshipIndex.value) {
      throw new Error('Relationship index has not been initialized.')
    }

    const learningSnapshot = await loadLearningSnapshot(languageCode)
    const roundPlan = planRound({
      languageProgress: learningSnapshot.progress,
      learningItemsByObjectName: learningSnapshot.itemsByObjectName,
      relationshipIndex: relationshipIndex.value,
      sentenceItemsByKey: learningSnapshot.sentenceItemsByKey
    })
    logRoundPlan(roundPlan, languageCode)

    activeTask.value = roundPlan.activeTask
    attemptCount = 0
    boardDifficulty = roundPlan.difficulty
    hadWrongAttempt = false
    placedObjects = roundPlan.placedObjects
    roundSelectionMode = roundPlan.selectionMode
    taskSuccess.value = false
    await boardScene?.initialize(placedObjects)
    boardScene?.setActiveTask(activeTask.value)
    taskText.value = activeTask.value.text
    void syncTaskAudio(activeTask.value)
  } catch (error) {
    await showRoundStartError(error)
  }
}

async function showLanguageSelectionState(): Promise<void> {
  activeTask.value = null
  attemptCount = 0
  boardDifficulty = 0
  hadWrongAttempt = false
  placedObjects = []
  roundSelectionMode = 'random'
  taskSuccess.value = false
  taskText.value = 'Choose a language to begin.'
  boardScene?.setActiveTask(null)
  setTaskReplayAvailability(null)
  await boardScene?.initialize([])
}

function handleIncorrectDrop(): void {
  if (isTransitioningRound) return

  attemptCount += 1

  if (!hadWrongAttempt) {
    hadWrongAttempt = true
    statsTracker?.breakStreak()
  }
}

async function handleTaskCompleted(): Promise<void> {
  if (isTransitioningRound || !activeTask.value) return

  const languageCode = selectedLanguageCode.value

  if (!languageCode) return

  isTransitioningRound = true
  attemptCount += 1
  const completedTask = activeTask.value
  const boardObjectNames = placedObjects.map(({ name }) => name)

  statsTracker?.recordCompletedTask(!hadWrongAttempt)
  taskSuccess.value = true

  try {
    await recordCompletedRound({
      activeTask: completedTask,
      attemptCount,
      boardObjectNames,
      difficulty: boardDifficulty,
      hadWrongAttempt,
      languageCode,
      selectionMode: roundSelectionMode
    })
    await delay(ROUND_SUCCESS_DELAY_MS)
    await startNewRound()
  } finally {
    isTransitioningRound = false
  }
}

async function selectLanguage(languageCode: string): Promise<void> {
  localeTaskMap = await loadLocaleTaskMap(languageCode)
  selectedLanguageCode.value = languageCode
  relationshipIndex.value = createRelationshipIndex(objectPool.value, localeTaskMap)

  if (!isTransitioningRound) {
    await startNewRound()
  }

  languageModalEl.value?.close()
}

onMounted(async () => {
  if (!sceneRootEl.value) return

  statsTracker = createStatsTracker()
  boardScene = new BoardScene(sceneRootEl.value, {
    modelsBaseUrl: MODELS_BASE_URL,
    onIncorrectDrop: handleIncorrectDrop,
    onTaskCompleted: () => {
      void handleTaskCompleted()
    }
  })
  unsubscribeStats = statsTracker.subscribe((snapshot) => {
    stats.value = snapshot
  })

  const [options, pool] = await Promise.all([loadLanguageOptions(), loadObjectPool()])
  languageOptions.value = options
  objectPool.value = pool

  if (selectedLanguageCode.value && !options.some((option) => option.code === selectedLanguageCode.value)) {
    selectedLanguageCode.value = null
  }

  if (!selectedLanguageCode.value) {
    await showLanguageSelectionState()
    openLanguageModal()
    return
  }

  localeTaskMap = await loadLocaleTaskMap(selectedLanguageCode.value)
  relationshipIndex.value = createRelationshipIndex(objectPool.value, localeTaskMap)
  await startNewRound()
})

onUnmounted(() => {
  unsubscribeStats?.()
  statsTracker?.destroy()
  boardScene?.dispose()
})
</script>

<template>
  <div class="flex h-[calc(100vh-8rem)] w-full flex-col">
    <section class="px-8 pt-5 pb-2">
      <div class="mx-auto flex max-w-5xl items-center gap-3">
        <div
          class="relative h-2 flex-1 overflow-hidden rounded-full bg-base-300/55"
          aria-hidden="true"
        >
          <span
            class="absolute inset-y-0 left-0 rounded-full transition-[width,background-color,opacity] duration-300"
            :class="streakBarCurrentFillClass"
            :style="{ width: streakBarCurrentFillWidth }"
          />
          <span
            class="absolute inset-y-0 left-0 rounded-full transition-[width,background-color,opacity] duration-300"
            :class="streakBarRecordFillClass"
            :style="{ width: streakBarRecordFillWidth }"
          />
        </div>
        <div
          class="flex shrink-0 items-center gap-1.5 text-sm font-semibold tabular-nums transition-colors duration-300"
          :class="streakIndicatorClass"
          :title="streakTitle"
        >
          <span
            class="flex items-center transition-colors duration-300"
            :class="streakIconClass"
          >
            <Flame class="size-4" />
          </span>
          <span>{{ stats.currentStreak }}</span>
        </div>
      </div>
    </section>

    <section class="px-8 pt-7 pb-4 text-center">
      <div class="relative mx-auto max-w-5xl">
        <h1
          class="mx-auto min-h-[1.1em] max-w-5xl pr-14 text-4xl font-extrabold leading-none text-balance md:text-6xl"
          :class="{ 'text-green-600': taskSuccess }"
        >
          {{ taskText }}
        </h1>
        <button
          type="button"
          class="btn btn-square btn-ghost absolute top-0 right-0"
          aria-label="Replay task audio"
          title="Replay task audio"
          :disabled="!replayAvailable"
          @click="replayTaskAudio()"
        >
          <Volume2 class="size-5" />
        </button>
      </div>
    </section>

    <div
      ref="sceneRootEl"
      class="min-h-0 flex-1"
    />

    <dialog
      ref="languageModalEl"
      class="modal"
      @cancel="handleModalCancel"
      @close="handleModalClose"
    >
      <div class="modal-box max-h-[calc(100vh-4rem)] max-w-2xl overflow-y-auto">
        <div class="mb-4">
          <h2 class="text-lg font-semibold">
            Which language do you want to practice?
          </h2>
          <p class="text-sm text-base-content/70">
            {{ currentLanguageText }}
          </p>
        </div>
        <section class="mb-5 rounded-box bg-base-200/70 p-4">
          <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_11rem] md:items-center">
            <div>
              <h3 class="text-base font-semibold">
                How to play
              </h3>
              <p class="mt-2 text-sm leading-6 text-base-content/75">
                Listen to the spoken instruction, then drag the objects on the board to act it out.
              </p>
              <p class="mt-2 text-sm leading-6 text-base-content/75">
                Finish the action correctly to get the next task. You can replay the audio any time with the speaker button.
              </p>
            </div>
            <img
              src="/data/tprboard/img/explain.webp"
              alt="Example board showing draggable objects during a task"
              class="h-36 w-full rounded-xl object-cover shadow-sm md:h-32"
            >
          </div>
        </section>
        <div class="mb-3">
          <h3 class="text-sm font-semibold uppercase tracking-[0.18em] text-base-content/55">
            Choose language
          </h3>
        </div>
        <div class="flex flex-col gap-2">
          <button
            v-for="option in languageOptions"
            :key="option.code"
            type="button"
            class="btn min-h-16 w-full justify-between px-4"
            :class="selectedLanguageCode === option.code ? 'btn-primary' : 'btn-outline'"
            :aria-pressed="selectedLanguageCode === option.code"
            @click="selectLanguage(option.code)"
          >
            <span class="text-left text-base font-medium">{{ option.name }}</span>
            <span class="rounded-full bg-base-200 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-base-content/60">{{ option.code }}</span>
          </button>
        </div>
        <div
          class="modal-action"
          :class="{ hidden: !hasSelectedLanguage }"
        >
          <form method="dialog">
            <button
              type="submit"
              class="btn"
            >
              Close
            </button>
          </form>
        </div>
      </div>
      <form
        method="dialog"
        class="modal-backdrop"
        :class="{ 'pointer-events-none': !hasSelectedLanguage }"
      >
        <button type="submit">
          close
        </button>
      </form>
    </dialog>
  </div>
</template>
