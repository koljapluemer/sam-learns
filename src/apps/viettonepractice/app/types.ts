// Domain types ported from linguanodon's viettonepractice/static/.../js/types.d.ts
// (dropping the ambient window.Vue/Chart/ChartErrorBars typings - real
// imports are used instead in this port).

export interface Clip {
  filename: string
  transcript: string
  audioSrc: string
}

export interface PracticeSessionConfig {
  audioBaseUrl: string
  apiClipsUrl: string
}

export interface DistractorCandidate {
  label: string
  changedIndex: number
  correctCharacter: string
  distractorCharacter: string
  correctTone: string
  distractorTone: string
}

export interface PracticeCatalogEntry {
  clip: Clip
  candidates: DistractorCandidate[]
}

export interface PracticePairTarget {
  correctKey: string
  distractorKey: string
}

export interface StoredClip {
  filename: string
  transcript: string
}

export type PracticeRoundSelectionMode = 'strategyA' | 'strategyB'

export interface PracticeEvent {
  eventType: 'roundStarted' | 'answer' | 'audioListened' | 'clipHidden'
  clip: StoredClip
  timestamp: string
  selectionMode?: PracticeRoundSelectionMode
  distractor?: string
  duration_ms?: number | null
  selectedTranscript?: string
  isCorrect?: boolean
  analyticsVersion?: 1
  changedIndex?: number
  correctCharacter?: string
  distractorCharacter?: string
  correctTone?: string | null
  distractorTone?: string | null
  id?: number
}

export interface PracticeExportSnapshot {
  exported_at: string
  event_log: PracticeEvent[]
}

export interface AnswerOption {
  label: string
  isCorrect: boolean
}

export interface DecayedPairHistoryStats {
  attempts: number
  correct: number
  decayedPosteriorAccuracy: number
  effectiveAttempts: number
  rawAccuracy: number | null
}

export interface MatrixCellStats {
  correctKey: string
  distractorKey: string
  attempts: number
  correct: number
  decayedPosteriorAccuracy: number | null
  effectiveAttempts: number
  rawAccuracy: number | null
}

export interface MatrixRowStats {
  key: string
  cells: MatrixCellStats[]
}

export interface MatrixTopPair {
  correctKey: string
  distractorKey: string
  label: string
  attempts: number
  correct: number
  decayedPosteriorAccuracy: number
  effectiveAttempts: number
}

export interface MatrixSummary {
  attempts: number
  correct: number
  decayedPosteriorAccuracy: number | null
  distinctPairs: number
  effectiveAttempts: number
  topPairs: MatrixTopPair[]
  rows: MatrixRowStats[]
}

export interface PracticeOverviewStats {
  totalExercises: number
  totalListeningMs: number
}

export interface DailyExercisePoint {
  day: string
  exercises: number
}

export interface DailyAccuracyPoint {
  day: string
  trials: number
  correct: number
  accuracy: number | null
  confidenceLow95: number | null
  confidenceHigh95: number | null
}

export interface PracticeStatsSnapshot {
  overview: PracticeOverviewStats
  dailyExercises: DailyExercisePoint[]
  dailyAccuracy: DailyAccuracyPoint[]
  tone: MatrixSummary
}

export interface AccuracyTrialPoint {
  trialNumber: number
  isCorrect: boolean
  rolling10: number
  rolling100: number
  rolling1000: number
}

export interface PairAccuracyTrialPoint {
  trialNumber: number
  timestamp: string
  isCorrect: boolean
  rolling10: number
}
