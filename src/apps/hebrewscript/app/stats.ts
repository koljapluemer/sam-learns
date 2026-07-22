// Pure port of linguanodon's hebrewscript app/stats.js - decayed Bayesian
// pair-confusion accuracy, daily series, Wilson confidence intervals, and
// rolling accuracy windows. Logic unchanged, only typed.

import { HEBREW_LETTER_KEYS } from './model'
import type {
  AccuracyTrialPoint,
  DailyAccuracyPoint,
  DailyExercisePoint,
  DecayedPairHistoryStats,
  DistractorCandidate,
  MatrixCellStats,
  MatrixSummary,
  PairAccuracyTrialPoint,
  PracticeEvent,
  PracticePairTarget,
  PracticeStatsSnapshot
} from './types'

const BETA_PRIOR_ALPHA = 2
const BETA_PRIOR_BETA = 1
const DECAY_HALF_LIFE_ATTEMPTS = 20
const DECAY_PER_ATTEMPT = 0.5 ** (1 / DECAY_HALF_LIFE_ATTEMPTS)
const RECENT_PAIR_WINDOW = 10
const TOP_PAIR_MIN_ATTEMPTS = 3
const WILSON_Z_95 = 1.959963984540054

const LOCAL_DAY_PARTS_FORMATTER = new Intl.DateTimeFormat(undefined, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
})

type PairCounts = { attempts: number; correct: number; weightedAttempts: number; weightedCorrect: number }

const calculateDecayedPosteriorAccuracy = (weightedCorrect: number, weightedAttempts: number) =>
  (weightedCorrect + BETA_PRIOR_ALPHA) / (weightedAttempts + BETA_PRIOR_ALPHA + BETA_PRIOR_BETA)

const getRawAccuracy = (correct: number, attempts: number) => (attempts ? correct / attempts : null)

const sortPairKeys = (leftKey: string, rightKey: string): [string, string] =>
  leftKey.localeCompare(rightKey) <= 0 ? [leftKey, rightKey] : [rightKey, leftKey]

export const getBidirectionalPracticePairKey = (leftKey: string, rightKey: string): string => {
  const [firstKey, secondKey] = sortPairKeys(leftKey, rightKey)
  return `${firstKey}|${secondKey}`
}

export const getDirectionalPracticePairKey = (correctKey: string, distractorKey: string): string =>
  `${correctKey}|${distractorKey}`

const toBidirectionalPracticePairTarget = (leftKey: string, rightKey: string): PracticePairTarget => {
  const [firstKey, secondKey] = sortPairKeys(leftKey, rightKey)
  return { correctKey: firstKey, distractorKey: secondKey }
}

const parsePairKey = (pairKey: string): PracticePairTarget | null => {
  const [correctKey, distractorKey] = pairKey.split('|')
  if (!correctKey || !distractorKey) return null
  return { correctKey, distractorKey }
}

const getTrackedAnswerEvents = (events: PracticeEvent[]) =>
  events.filter((event) => event.eventType === 'answer' && event.analyticsVersion === 1 && typeof event.isCorrect === 'boolean')

const getAnswerEvents = (events: PracticeEvent[]) => events.filter((event) => event.eventType === 'answer')

const getAccuracyAnswerEvents = (events: PracticeEvent[]) =>
  events.filter((event) => event.eventType === 'answer' && typeof event.isCorrect === 'boolean')

const getAudioListenedEvents = (events: PracticeEvent[]) =>
  events.filter(
    (event) =>
      event.eventType === 'audioListened' &&
      typeof event.duration_ms === 'number' &&
      Number.isFinite(event.duration_ms) &&
      event.duration_ms > 0
  )

const getEventPairTarget = (event: PracticeEvent): PracticePairTarget | null =>
  event.correctLetter && event.distractorLetter
    ? toBidirectionalPracticePairTarget(event.correctLetter, event.distractorLetter)
    : null

const getDirectionalEventPairTarget = (event: PracticeEvent): PracticePairTarget | null =>
  event.correctLetter && event.distractorLetter
    ? { correctKey: event.correctLetter, distractorKey: event.distractorLetter }
    : null

export const getCandidatePairTarget = (candidate: DistractorCandidate): PracticePairTarget =>
  toBidirectionalPracticePairTarget(candidate.correctLetter, candidate.distractorLetter)

export const getDirectionalCandidatePairTarget = (candidate: DistractorCandidate): PracticePairTarget => ({
  correctKey: candidate.correctLetter,
  distractorKey: candidate.distractorLetter
})

function buildDecayedPairCounts(
  events: PracticeEvent[],
  getTarget: (event: PracticeEvent) => PracticePairTarget | null,
  getKey: (target: PracticePairTarget) => string
): Map<string, PairCounts> {
  const counts = new Map<string, PairCounts>()

  events.forEach((event) => {
    const pairTarget = getTarget(event)
    if (!pairTarget) return

    const pairKey = getKey(pairTarget)
    const current = counts.get(pairKey) ?? { attempts: 0, correct: 0, weightedAttempts: 0, weightedCorrect: 0 }

    counts.set(pairKey, {
      attempts: current.attempts + 1,
      correct: current.correct + (event.isCorrect ? 1 : 0),
      weightedAttempts: current.weightedAttempts * DECAY_PER_ATTEMPT + 1,
      weightedCorrect: current.weightedCorrect * DECAY_PER_ATTEMPT + (event.isCorrect ? 1 : 0)
    })
  })

  return counts
}

const buildDirectionalPairCounts = (events: PracticeEvent[]) =>
  buildDecayedPairCounts(events, getDirectionalEventPairTarget, (target) =>
    getDirectionalPracticePairKey(target.correctKey, target.distractorKey)
  )

const buildBidirectionalDecayedPairCounts = (events: PracticeEvent[]) =>
  buildDecayedPairCounts(events, getEventPairTarget, (target) =>
    getBidirectionalPracticePairKey(target.correctKey, target.distractorKey)
  )

const toDecayedPairHistoryStats = (pair: PairCounts): DecayedPairHistoryStats => ({
  attempts: pair.attempts,
  correct: pair.correct,
  decayedPosteriorAccuracy: calculateDecayedPosteriorAccuracy(pair.weightedCorrect, pair.weightedAttempts),
  effectiveAttempts: pair.weightedAttempts,
  rawAccuracy: getRawAccuracy(pair.correct, pair.attempts)
})

export const getBidirectionalDecayedPairHistory = (events: PracticeEvent[]): Map<string, DecayedPairHistoryStats> => {
  const counts = buildBidirectionalDecayedPairCounts(getTrackedAnswerEvents(events))
  return new Map([...counts.entries()].map(([pairKey, pairCounts]) => [pairKey, toDecayedPairHistoryStats(pairCounts)]))
}

export const getDirectionalDecayedPairHistory = (events: PracticeEvent[]): Map<string, DecayedPairHistoryStats> => {
  const counts = buildDirectionalPairCounts(getTrackedAnswerEvents(events))
  return new Map([...counts.entries()].map(([pairKey, pairCounts]) => [pairKey, toDecayedPairHistoryStats(pairCounts)]))
}

const getLocalDayKey = (timestamp: string): string => {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return timestamp.slice(0, 10)

  const parts = LOCAL_DAY_PARTS_FORMATTER.formatToParts(date)
  const year = parts.find((part) => part.type === 'year')?.value ?? '0000'
  const month = parts.find((part) => part.type === 'month')?.value ?? '01'
  const day = parts.find((part) => part.type === 'day')?.value ?? '01'
  return `${year}-${month}-${day}`
}

const getDailyExerciseSeries = (events: PracticeEvent[]): DailyExercisePoint[] => {
  const counts = new Map<string, number>()
  events.forEach((event) => {
    const day = getLocalDayKey(event.timestamp)
    counts.set(day, (counts.get(day) ?? 0) + 1)
  })

  return [...counts.entries()]
    .sort(([leftDay], [rightDay]) => leftDay.localeCompare(rightDay))
    .map(([day, exercises]) => ({ day, exercises }))
}

const getWilsonConfidenceInterval95 = (correct: number, trials: number): { high: number | null; low: number | null } => {
  if (trials <= 0) return { high: null, low: null }

  const zSquared = WILSON_Z_95 ** 2
  const proportion = correct / trials
  const denominator = 1 + zSquared / trials
  const center = (proportion + zSquared / (2 * trials)) / denominator
  const margin = (WILSON_Z_95 * Math.sqrt((proportion * (1 - proportion)) / trials + zSquared / (4 * trials ** 2))) / denominator

  return { high: Math.min(1, center + margin), low: Math.max(0, center - margin) }
}

const getDailyAccuracySeries = (events: PracticeEvent[]): DailyAccuracyPoint[] => {
  const counts = new Map<string, { correct: number; trials: number }>()

  events.forEach((event) => {
    const day = getLocalDayKey(event.timestamp)
    const current = counts.get(day) ?? { correct: 0, trials: 0 }
    counts.set(day, { correct: current.correct + (event.isCorrect ? 1 : 0), trials: current.trials + 1 })
  })

  return [...counts.entries()]
    .sort(([leftDay], [rightDay]) => leftDay.localeCompare(rightDay))
    .map(([day, { correct, trials }]) => {
      const interval = getWilsonConfidenceInterval95(correct, trials)
      return {
        accuracy: trials ? correct / trials : null,
        confidenceHigh95: interval.high,
        confidenceLow95: interval.low,
        correct,
        day,
        trials
      }
    })
}

const getPracticeOverview = (answerEvents: PracticeEvent[], audioListenedEvents: PracticeEvent[]) => ({
  totalExercises: answerEvents.length,
  totalListeningMs: audioListenedEvents.reduce((sum, event) => sum + (event.duration_ms ?? 0), 0)
})

const getEmptyMatrixCell = (correctKey: string, distractorKey: string): MatrixCellStats => ({
  correctKey,
  distractorKey,
  attempts: 0,
  correct: 0,
  decayedPosteriorAccuracy: null,
  effectiveAttempts: 0,
  rawAccuracy: null
})

function toMatrixSummary(keys: readonly string[], counts: Map<string, PairCounts>): MatrixSummary {
  const pairEntries = [...counts.entries()]
    .map(([pairKey, pairCounts]) => {
      const target = parsePairKey(pairKey)
      if (!target) return null

      return {
        target,
        stats: {
          attempts: pairCounts.attempts,
          correct: pairCounts.correct,
          decayedPosteriorAccuracy: calculateDecayedPosteriorAccuracy(pairCounts.weightedCorrect, pairCounts.weightedAttempts),
          effectiveAttempts: pairCounts.weightedAttempts,
          weightedCorrect: pairCounts.weightedCorrect,
          rawAccuracy: getRawAccuracy(pairCounts.correct, pairCounts.attempts)
        }
      }
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)

  const rows = keys.map((correctKey) => ({
    key: correctKey,
    cells: keys.map((distractorKey) => {
      if (correctKey === distractorKey) return getEmptyMatrixCell(correctKey, distractorKey)

      const pair = counts.get(getDirectionalPracticePairKey(correctKey, distractorKey))
      if (!pair) return getEmptyMatrixCell(correctKey, distractorKey)

      return {
        correctKey,
        distractorKey,
        attempts: pair.attempts,
        correct: pair.correct,
        decayedPosteriorAccuracy: calculateDecayedPosteriorAccuracy(pair.weightedCorrect, pair.weightedAttempts),
        effectiveAttempts: pair.weightedAttempts,
        rawAccuracy: getRawAccuracy(pair.correct, pair.attempts)
      }
    })
  }))

  const attempts = pairEntries.reduce((sum, entry) => sum + entry.stats.attempts, 0)
  const correct = pairEntries.reduce((sum, entry) => sum + entry.stats.correct, 0)
  const weightedAttempts = pairEntries.reduce((sum, entry) => sum + entry.stats.effectiveAttempts, 0)
  const weightedCorrect = pairEntries.reduce((sum, entry) => sum + entry.stats.weightedCorrect, 0)

  const topPairs = pairEntries
    .filter((entry) => entry.stats.attempts >= TOP_PAIR_MIN_ATTEMPTS)
    .sort((left, right) => {
      if (left.stats.decayedPosteriorAccuracy !== right.stats.decayedPosteriorAccuracy) {
        return left.stats.decayedPosteriorAccuracy - right.stats.decayedPosteriorAccuracy
      }
      if (left.stats.effectiveAttempts !== right.stats.effectiveAttempts) {
        return right.stats.effectiveAttempts - left.stats.effectiveAttempts
      }
      return right.stats.attempts - left.stats.attempts
    })
    .slice(0, 5)
    .map(({ target, stats }) => ({
      correctKey: target.correctKey,
      distractorKey: target.distractorKey,
      label: `${target.correctKey} -> ${target.distractorKey}`,
      attempts: stats.attempts,
      correct: stats.correct,
      decayedPosteriorAccuracy: stats.decayedPosteriorAccuracy,
      effectiveAttempts: stats.effectiveAttempts
    }))

  return {
    attempts,
    correct,
    decayedPosteriorAccuracy: weightedAttempts ? calculateDecayedPosteriorAccuracy(weightedCorrect, weightedAttempts) : null,
    distinctPairs: pairEntries.length,
    effectiveAttempts: weightedAttempts,
    topPairs,
    rows
  }
}

export const getPracticeStatsSnapshot = (events: PracticeEvent[]): PracticeStatsSnapshot => {
  const answerEvents = getAnswerEvents(events)
  const accuracyAnswerEvents = getAccuracyAnswerEvents(events)
  const trackedEvents = getTrackedAnswerEvents(events)
  const audioListenedEvents = getAudioListenedEvents(events)

  return {
    overview: getPracticeOverview(answerEvents, audioListenedEvents),
    dailyAccuracy: getDailyAccuracySeries(accuracyAnswerEvents),
    dailyExercises: getDailyExerciseSeries(answerEvents),
    letter: toMatrixSummary(HEBREW_LETTER_KEYS, buildDirectionalPairCounts(trackedEvents))
  }
}

export const getAccuracyTrialSeries = (events: PracticeEvent[], visibleWindow?: number): AccuracyTrialPoint[] => {
  const answerEvents = getAccuracyAnswerEvents(events)
  const trials: AccuracyTrialPoint[] = []
  let rolling10Correct = 0
  let rolling100Correct = 0
  let rolling1000Correct = 0

  answerEvents.forEach((event, index) => {
    const value = event.isCorrect ? 1 : 0
    rolling10Correct += value
    rolling100Correct += value
    rolling1000Correct += value

    if (index >= 10) rolling10Correct -= answerEvents[index - 10].isCorrect ? 1 : 0
    if (index >= 100) rolling100Correct -= answerEvents[index - 100].isCorrect ? 1 : 0
    if (index >= 1000) rolling1000Correct -= answerEvents[index - 1000].isCorrect ? 1 : 0

    trials.push({
      trialNumber: index + 1,
      isCorrect: !!event.isCorrect,
      rolling10: rolling10Correct / Math.min(index + 1, 10),
      rolling100: rolling100Correct / Math.min(index + 1, 100),
      rolling1000: rolling1000Correct / Math.min(index + 1, 1000)
    })
  })

  return typeof visibleWindow === 'number' ? trials.slice(-visibleWindow) : trials
}

export const getPairAccuracyTrialSeries = (events: PracticeEvent[], pairTarget: PracticePairTarget): PairAccuracyTrialPoint[] => {
  const pairKey = getDirectionalPracticePairKey(pairTarget.correctKey, pairTarget.distractorKey)
  const recentResults: boolean[] = []

  return getTrackedAnswerEvents(events).reduce<PairAccuracyTrialPoint[]>((trials, event) => {
    const eventPairTarget = getDirectionalEventPairTarget(event)
    if (!eventPairTarget || getDirectionalPracticePairKey(eventPairTarget.correctKey, eventPairTarget.distractorKey) !== pairKey) {
      return trials
    }

    recentResults.push(!!event.isCorrect)
    if (recentResults.length > RECENT_PAIR_WINDOW) recentResults.shift()

    const recentCorrect = recentResults.filter(Boolean).length
    trials.push({
      trialNumber: trials.length + 1,
      timestamp: event.timestamp,
      isCorrect: !!event.isCorrect,
      rolling10: recentCorrect / recentResults.length
    })

    return trials
  }, [])
}
