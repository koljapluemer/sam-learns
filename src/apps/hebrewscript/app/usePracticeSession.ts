// Ported from linguanodon's hebrewscript app/session.js, using real Vue
// Composition API imports instead of window.Vue. No accounts/sync - the
// queueEvent('hebrewscript', 'trial', ...) call is replaced with
// logActivity('hebrewscript') (see docs/linguanodon-import.md).

import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { logActivity } from '@/shared/activity/useLearningEvent'
import { toClips, buildPracticeCatalog } from './catalog'
import { appendPracticeEvent, listPracticeEvents, toPracticeEventAnalytics, toStoredClip } from './practiceEvents'
import {
  getBidirectionalDecayedPairHistory,
  getBidirectionalPracticePairKey,
  getCandidatePairTarget,
  getDirectionalCandidatePairTarget,
  getDirectionalDecayedPairHistory,
  getDirectionalPracticePairKey
} from './stats'
import type {
  AnswerOption,
  Clip,
  DecayedPairHistoryStats,
  DistractorCandidate,
  PracticeCatalogEntry,
  PracticeEvent,
  PracticeRound
} from './types'

const BATCH_SIZE = 3
const MAX_ROUND_GENERATION_ATTEMPTS = 100
const INTERACTIVE_TAG_NAMES = new Set(['A', 'AUDIO', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'])
const DIRECTION_BALANCE_PREFERENCE = 2 / 3

type PracticeExercise = {
  clip: Clip
  candidate: DistractorCandidate
  directionalPairTarget: { correctKey: string; distractorKey: string }
  pairTarget: { correctKey: string; distractorKey: string }
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

function pickRandom<T>(items: T[]): T | null {
  return items.length ? (items[Math.floor(Math.random() * items.length)] ?? null) : null
}

const getStrategyBScore = (pairHistory: DecayedPairHistoryStats | undefined) =>
  !pairHistory ? -1 : pairHistory.decayedPosteriorAccuracy

export interface PracticeSessionConfig {
  audioBaseUrl: string
  apiClipsUrl: string
}

export function usePracticeSession(config: PracticeSessionConfig) {
  const clips = ref<Clip[]>([])
  const practiceEvents = ref<PracticeEvent[]>([])
  const round = ref<PracticeRound | null>(null)
  const phase = ref<'loading' | 'ready' | 'wrong'>('loading')
  const disabledButtonIndex = ref<number | null>(null)
  const audioRef = ref<HTMLAudioElement | null>(null)
  const taskStartTime = ref<number | null>(null)
  const currentListeningMs = ref(0)
  const currentListeningClip = ref<ReturnType<typeof toStoredClip> | null>(null)
  const currentListeningDistractor = ref<string | undefined>(undefined)
  const currentListeningSelectionMode = ref<PracticeEvent['selectionMode']>(undefined)
  const lastAudioPositionSeconds = ref<number | null>(null)
  const autoplayHint = ref('')
  const loadError = ref('')
  const hiddenClipFilenames = ref(new Set<string>())
  let clipCatalog: PracticeCatalogEntry[] = []

  const answerOptions = computed<AnswerOption[]>(() => round.value?.options ?? [])
  const changedCharacterIndex = computed(() => round.value?.candidate.changedIndex ?? -1)

  const splitLabel = (label: string) => [...label]

  const isInteractiveShortcutTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false
    return target.isContentEditable || INTERACTIVE_TAG_NAMES.has(target.tagName)
  }

  const sampleCatalogEntries = () =>
    shuffle(clipCatalog.filter((entry) => !hiddenClipFilenames.value.has(entry.clip.filename))).slice(
      0,
      Math.min(BATCH_SIZE, clips.value.length)
    )

  const syncAvailableClips = () => {
    clips.value = clipCatalog.filter((entry) => !hiddenClipFilenames.value.has(entry.clip.filename)).map((entry) => entry.clip)
  }

  const syncHiddenClipsFromEvents = () => {
    hiddenClipFilenames.value = new Set(
      practiceEvents.value.filter((event) => event.eventType === 'clipHidden').map((event) => event.clip.filename)
    )
    syncAvailableClips()
  }

  const getExercises = (entries: PracticeCatalogEntry[]): PracticeExercise[] =>
    entries.flatMap((entry) =>
      entry.candidates
        .map((candidate) => {
          const pairTarget = getCandidatePairTarget(candidate)
          const directionalPairTarget = getDirectionalCandidatePairTarget(candidate)
          if (!pairTarget || !directionalPairTarget) return null
          return { clip: entry.clip, candidate, directionalPairTarget, pairTarget }
        })
        .filter((exercise): exercise is PracticeExercise => exercise !== null)
    )

  const groupExercisesByPair = (exercises: PracticeExercise[]) => {
    const groups = new Map<string, Map<string, PracticeExercise[]>>()
    exercises.forEach((exercise) => {
      const pairKey = getBidirectionalPracticePairKey(exercise.pairTarget.correctKey, exercise.pairTarget.distractorKey)
      const directionKey = getDirectionalPracticePairKey(
        exercise.directionalPairTarget.correctKey,
        exercise.directionalPairTarget.distractorKey
      )
      const directions = groups.get(pairKey) ?? new Map<string, PracticeExercise[]>()
      const current = directions.get(directionKey) ?? []
      current.push(exercise)
      directions.set(directionKey, current)
      groups.set(pairKey, directions)
    })
    return groups
  }

  const createRound = (exercise: PracticeExercise, selectionMode: 'strategyA' | 'strategyB'): PracticeRound => ({
    clip: exercise.clip,
    candidate: exercise.candidate,
    selectionMode,
    options: shuffle([
      { label: exercise.clip.transcript, isCorrect: true },
      { label: exercise.candidate.label, isCorrect: false }
    ])
  })

  const chooseStrategyAExercise = (
    pairExercises: Map<string, Map<string, PracticeExercise[]>>,
    pairHistory: Map<string, DecayedPairHistoryStats>
  ) => {
    const undertrainedPairKeys = [...pairExercises.entries()]
      .filter(([pairKey]) => (pairHistory.get(pairKey)?.attempts ?? 0) < 10)
      .map(([pairKey]) => pairKey)
    return pickRandom(undertrainedPairKeys.length ? undertrainedPairKeys : [...pairExercises.keys()])
  }

  const chooseStrategyBPairKey = (
    pairExercises: Map<string, Map<string, PracticeExercise[]>>,
    pairHistory: Map<string, DecayedPairHistoryStats>
  ) => {
    let lowestScore = Number.POSITIVE_INFINITY
    let weakestPairKeys: string[] = []

    pairExercises.forEach((_, pairKey) => {
      const score = getStrategyBScore(pairHistory.get(pairKey))
      if (score < lowestScore) {
        lowestScore = score
        weakestPairKeys = [pairKey]
        return
      }
      if (score === lowestScore) weakestPairKeys.push(pairKey)
    })

    return pickRandom(weakestPairKeys)
  }

  const chooseDirectionKey = (
    directionalExercises: Map<string, PracticeExercise[]>,
    directionalHistory: Map<string, DecayedPairHistoryStats>
  ) => {
    const directionKeys = [...directionalExercises.keys()]
    if (!directionKeys.length) return null
    if (directionKeys.length === 1) return directionKeys[0]

    const [firstKey, secondKey] = directionKeys
    const firstAttempts = directionalHistory.get(firstKey)?.effectiveAttempts ?? 0
    const secondAttempts = directionalHistory.get(secondKey)?.effectiveAttempts ?? 0

    if (firstAttempts === secondAttempts) return pickRandom(directionKeys)

    const lessPracticedKey = firstAttempts < secondAttempts ? firstKey : secondKey
    const morePracticedKey = lessPracticedKey === firstKey ? secondKey : firstKey

    return Math.random() < DIRECTION_BALANCE_PREFERENCE ? lessPracticedKey : morePracticedKey
  }

  const chooseExerciseForPair = (
    pairKey: string,
    pairExercises: Map<string, Map<string, PracticeExercise[]>>,
    directionalHistory: Map<string, DecayedPairHistoryStats>
  ) => {
    const directionalExercises = pairExercises.get(pairKey)
    if (!directionalExercises) return null

    const selectedDirectionKey = chooseDirectionKey(directionalExercises, directionalHistory)
    if (!selectedDirectionKey) return null

    return pickRandom(directionalExercises.get(selectedDirectionKey) ?? [])
  }

  const generateNextRound = (): PracticeRound | null => {
    const pairHistory = getBidirectionalDecayedPairHistory(practiceEvents.value)
    const directionalHistory = getDirectionalDecayedPairHistory(practiceEvents.value)
    const visibleCatalogEntries = clipCatalog.filter((entry) => !hiddenClipFilenames.value.has(entry.clip.filename))
    const allPairExercises = groupExercisesByPair(getExercises(visibleCatalogEntries))

    for (let attempt = 0; attempt < MAX_ROUND_GENERATION_ATTEMPTS; attempt += 1) {
      const sampledEntries = sampleCatalogEntries()
      const sampledExercises = getExercises(sampledEntries)
      if (!sampledExercises.length) continue

      const pairExercises = groupExercisesByPair(sampledExercises)
      const useStrategyB = Math.random() > 0.5
      const selectionMode = useStrategyB ? 'strategyB' : 'strategyA'
      const selectedPairKey = useStrategyB
        ? chooseStrategyBPairKey(pairExercises, pairHistory)
        : chooseStrategyAExercise(pairExercises, pairHistory)
      const selectedExercise = selectedPairKey ? chooseExerciseForPair(selectedPairKey, allPairExercises, directionalHistory) : null

      if (selectedExercise) return createRound(selectedExercise, selectionMode)
    }

    return null
  }

  const replayAudio = async () => {
    const audio = audioRef.value
    if (!audio) return

    autoplayHint.value = ''
    audio.pause()
    audio.currentTime = 0

    try {
      await audio.play()
    } catch {
      autoplayHint.value = 'Autoplay was blocked. Press replay.'
    }
  }

  const resetAudioPlaybackTracking = () => {
    currentListeningMs.value = 0
    currentListeningClip.value = null
    currentListeningDistractor.value = undefined
    currentListeningSelectionMode.value = undefined
    lastAudioPositionSeconds.value = null
  }

  const updateCurrentListeningMs = () => {
    const audio = audioRef.value
    if (!audio || lastAudioPositionSeconds.value === null) return

    const progressedSeconds = audio.currentTime - lastAudioPositionSeconds.value
    if (progressedSeconds > 0) currentListeningMs.value += progressedSeconds * 1000
    lastAudioPositionSeconds.value = audio.currentTime
  }

  const handleAudioPlay = () => {
    const audio = audioRef.value
    if (!audio || !round.value || lastAudioPositionSeconds.value !== null) return

    currentListeningClip.value = toStoredClip(round.value.clip)
    currentListeningDistractor.value = round.value.candidate.label
    currentListeningSelectionMode.value = round.value.selectionMode
    lastAudioPositionSeconds.value = audio.currentTime
  }

  const handleAudioTimeUpdate = () => updateCurrentListeningMs()

  const handleAudioSeek = () => {
    const audio = audioRef.value
    if (!audio || lastAudioPositionSeconds.value === null) return
    lastAudioPositionSeconds.value = audio.currentTime
  }

  const finalizeAudioPlaybackTracking = async () => {
    updateCurrentListeningMs()

    const listenedDurationMs = Math.round(currentListeningMs.value)
    const clip = currentListeningClip.value
    const distractor = currentListeningDistractor.value
    const selectionMode = currentListeningSelectionMode.value

    resetAudioPlaybackTracking()

    if (!clip || listenedDurationMs < 250) return

    const audioListenedEvent: PracticeEvent = {
      eventType: 'audioListened',
      clip,
      timestamp: new Date().toISOString(),
      selectionMode,
      distractor,
      duration_ms: listenedDurationMs
    }

    await appendPracticeEvent(audioListenedEvent)
    practiceEvents.value.push(audioListenedEvent)
  }

  const handleAudioPause = () => {
    void finalizeAudioPlaybackTracking()
  }

  const handleAudioEnded = () => {
    void finalizeAudioPlaybackTracking()
  }

  const hideCurrentClip = async () => {
    if (!round.value) return

    phase.value = 'loading'

    const clipHiddenEvent: PracticeEvent = {
      eventType: 'clipHidden',
      clip: toStoredClip(round.value.clip),
      timestamp: new Date().toISOString()
    }

    audioRef.value?.pause()
    await finalizeAudioPlaybackTracking()
    await appendPracticeEvent(clipHiddenEvent)
    practiceEvents.value.push(clipHiddenEvent)
    syncHiddenClipsFromEvents()
    await setNextRound()
  }

  const setNextRound = async () => {
    if (!clips.value.length) {
      loadError.value = clipCatalog.length
        ? 'No practice clips left. Hidden clips stay excluded.'
        : 'No clips matched the current transcript filter.'
      round.value = null
      phase.value = 'loading'
      return
    }

    phase.value = 'loading'
    disabledButtonIndex.value = null
    autoplayHint.value = ''
    loadError.value = ''

    const nextRound = generateNextRound()

    if (!nextRound) {
      loadError.value = 'Could not generate a distinct distractor for the available clips.'
      round.value = null
      return
    }

    round.value = nextRound

    const roundStartedEvent: PracticeEvent = {
      eventType: 'roundStarted',
      clip: toStoredClip(nextRound.clip),
      timestamp: new Date().toISOString(),
      selectionMode: nextRound.selectionMode,
      distractor: nextRound.candidate.label
    }

    await appendPracticeEvent(roundStartedEvent)
    practiceEvents.value.push(roundStartedEvent)

    phase.value = 'ready'
    taskStartTime.value = Date.now()

    await nextTick()
    await replayAudio()
  }

  const handleAnswer = async (option: AnswerOption, buttonIndex: number) => {
    if (!round.value) return
    if (phase.value !== 'ready' && phase.value !== 'wrong') return
    if (disabledButtonIndex.value === buttonIndex) return

    if (phase.value === 'ready') {
      const answerEvent: PracticeEvent = {
        eventType: 'answer',
        clip: toStoredClip(round.value.clip),
        timestamp: new Date().toISOString(),
        selectionMode: round.value.selectionMode,
        distractor: round.value.candidate.label,
        duration_ms: taskStartTime.value === null ? null : Date.now() - taskStartTime.value,
        selectedTranscript: option.label,
        isCorrect: option.isCorrect,
        ...toPracticeEventAnalytics(round.value.candidate)
      }

      await appendPracticeEvent(answerEvent)
      practiceEvents.value.push(answerEvent)
      void logActivity('hebrewscript')
    }

    if (option.isCorrect) {
      audioRef.value?.pause()
      await finalizeAudioPlaybackTracking()
      phase.value = 'loading'
      await setNextRound()
      return
    }

    phase.value = 'wrong'
    disabledButtonIndex.value = buttonIndex
  }

  const handleKeydown = (event: KeyboardEvent) => {
    if (phase.value !== 'ready' && phase.value !== 'wrong') return

    if (event.code === 'Space') {
      if (isInteractiveShortcutTarget(event.target)) return
      event.preventDefault()
      void replayAudio()
      return
    }

    if (answerOptions.value.length !== 2) return

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      void handleAnswer(answerOptions.value[0], 0)
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      void handleAnswer(answerOptions.value[1], 1)
    }
  }

  const loadSessionState = async () => {
    const clipsResponse = await fetch(config.apiClipsUrl)
    if (!clipsResponse.ok) throw new Error('Could not load clip data.')

    const rawClips = (await clipsResponse.json()) as { filename: string; transcript: string }[]
    const parsedClips = toClips(rawClips, config.audioBaseUrl)
    clipCatalog = buildPracticeCatalog(parsedClips)
    practiceEvents.value = await listPracticeEvents()
    syncHiddenClipsFromEvents()
  }

  const initialize = async () => {
    try {
      await loadSessionState()
      await setNextRound()
    } catch {
      loadError.value = 'Could not load clip data.'
      round.value = null
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
    void initialize()
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
    void finalizeAudioPlaybackTracking()
  })

  return {
    answerOptions,
    audioRef,
    autoplayHint,
    changedCharacterIndex,
    disabledButtonIndex,
    handleAnswer,
    handleAudioEnded,
    handleAudioPause,
    handleAudioPlay,
    handleAudioSeek,
    handleAudioTimeUpdate,
    hideCurrentClip,
    loadError,
    phase,
    replayAudio,
    round,
    splitLabel
  } as const
}

export type UsePracticeSession = ReturnType<typeof usePracticeSession>
