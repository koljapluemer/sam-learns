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
