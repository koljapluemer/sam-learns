export const exerciseTopics = [
  'combine-like-terms',
  'normalize-product-powers',
  'remove-parentheses-with-sign',
  'distribute-monomial-over-sum',
  'expand-monomial-times-parenthesized-product',
  'expand-binomial-times-binomial',
  'signed-product-with-follow-up-combine',
  'challenge-mixed-expressions'
] as const

export type ExerciseTopic = (typeof exerciseTopics)[number]

export type DifficultyBand = 1 | 2 | 3 | 4 | 5

export type ExerciseFeature =
  | 'challenge'
  | 'expanded-factors'
  | 'follow-up-combine'
  | 'implicit-product'
  | 'negative-coefficient'
  | 'non-adjacent-like-terms'
  | 'outer-minus'
  | 'power-notation'
  | 'reordered-factors'
  | 'sign-flip'
  | 'split-coefficient'
  | 'two-groups'
  | 'variable-overlap'

export type ExpressionExercise = {
  id: string
  topic: ExerciseTopic
  source: string
  target: string
  difficultyBand: DifficultyBand
  difficultyScore: number
  features: ExerciseFeature[]
  seed: string
  trace?: string[]
}

export type GradeReason =
  | 'empty'
  | 'parseError'
  | 'notEquivalent'
  | 'copied'
  | 'tooComplex'
  | 'correct'

export type AttemptResultReason = GradeReason | 'revealed'

export type GradeResult = {
  isCorrect: boolean
  reason: GradeReason
}

export type TopicProgress = {
  topic: ExerciseTopic
  skillEstimate: number
  lastSeenAt: string | null
  recentAccuracy: number
  streak: number
  dueAt: string | null
}

export type ExerciseAttempt = {
  id: string
  timestamp: string
  exerciseId: string
  topic: ExerciseTopic
  difficultyBand: DifficultyBand
  difficultyScore: number
  features: ExerciseFeature[]
  source: string
  target: string
  answer: string
  resultReason: AttemptResultReason
  isCorrect: boolean
  latencyMs: number
}
