// Domain types ported from linguanodon's arabicnumbers/static/.../js/types.d.ts
// (dropping the ambient window.Vue typings, which only existed there because
// that build had no real Vue import).

export type ExerciseType = 'val' | 'ar' | 'ar_long' | 'en' | 'transliteration'
export type AnswerValue = string | number

export interface SRState {
  interval: number
  repetitions: number
  dueAt: number | null
}

export interface NumberEntry {
  val: number
  ar: string
  ar_long: string
  en: string
  transliteration: string
  level: number
  sr: SRState
}

export interface ExerciseStat {
  guessWasCorrect: boolean
  guess: AnswerValue
  correctAnswer: AnswerValue
  prompt: AnswerValue
  promptType: ExerciseType
  answerType: ExerciseType
  timestamp: number
}

export interface ExerciseSRState {
  repetitions: number
  interval: number
  dueAt: number
}

export interface Exercise {
  key: string
  promptType: ExerciseType
  answerType: ExerciseType
  prompt: AnswerValue
  correctAnswer: AnswerValue
  stats: ExerciseStat[]
  sr: ExerciseSRState
  number: NumberEntry
}

export interface MissionProgress {
  goals: number[]
  progress: number
  currentGoal: number
}

export interface Missions {
  'Exercises Done': MissionProgress
  Streak: MissionProgress
}

export interface StoredNumberState {
  val: number
  level: number
  sr: SRState
}

export interface StoredExerciseState {
  key: string
  stats: ExerciseStat[]
  sr: ExerciseSRState
}

export interface ApiNumber {
  value: number
  numeral: string
  script: string
  english: string
  transliteration: string
}
