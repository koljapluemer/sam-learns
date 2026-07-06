import { pickRandom } from '@/apps/simplify-expressions/dumb/random'
import {
  listTopicProgress,
  saveAttemptAndProgress
} from './exerciseRepository'
import { generateExercise } from './exerciseGenerator'
import type {
  AttemptResultReason,
  DifficultyBand,
  ExerciseAttempt,
  ExerciseTopic,
  ExpressionExercise,
  TopicProgress
} from './exerciseTypes'

const coreTopics: ExerciseTopic[] = [
  'combine-like-terms',
  'remove-parentheses-with-sign',
  'distribute-monomial-over-sum'
]

const topicPrerequisites: Partial<Record<ExerciseTopic, ExerciseTopic[]>> = {
  'normalize-product-powers': ['combine-like-terms'],
  'expand-monomial-times-parenthesized-product': [
    'remove-parentheses-with-sign',
    'distribute-monomial-over-sum'
  ],
  'expand-binomial-times-binomial': [
    'remove-parentheses-with-sign',
    'distribute-monomial-over-sum'
  ],
  'signed-product-with-follow-up-combine': [
    'normalize-product-powers',
    'expand-binomial-times-binomial'
  ],
  'challenge-mixed-expressions': [
    'combine-like-terms',
    'normalize-product-powers',
    'remove-parentheses-with-sign',
    'distribute-monomial-over-sum',
    'expand-monomial-times-parenthesized-product',
    'expand-binomial-times-binomial',
    'signed-product-with-follow-up-combine'
  ]
}

const allTopics: ExerciseTopic[] = [
  ...coreTopics,
  'normalize-product-powers',
  'expand-monomial-times-parenthesized-product',
  'expand-binomial-times-binomial',
  'signed-product-with-follow-up-combine',
  'challenge-mixed-expressions'
]

export async function getNextExercise(): Promise<ExpressionExercise> {
  const progressEntries = await listTopicProgress()
  const progressByTopic = new Map(progressEntries.map((entry) => [entry.topic, entry]))
  const unlockedTopics = getUnlockedTopics(progressByTopic)
  const topic = selectTopic(unlockedTopics, progressByTopic)
  const difficultyBand = selectDifficultyBand(topic, progressByTopic.get(topic))

  return generateExercise(topic, difficultyBand)
}

export async function recordExerciseAttempt(input: {
  exercise: ExpressionExercise
  answer: string
  resultReason: AttemptResultReason
  isCorrect: boolean
  latencyMs: number
}) {
  const previous = (await listTopicProgress()).find((entry) => entry.topic === input.exercise.topic)
  const nextProgress = updateTopicProgress(previous ?? createDefaultTopicProgress(input.exercise.topic), input)
  const attempt = createExerciseAttempt(input)

  await saveAttemptAndProgress(attempt, nextProgress)
  return attempt
}

export function createDefaultTopicProgress(topic: ExerciseTopic): TopicProgress {
  return {
    topic,
    skillEstimate: 1,
    lastSeenAt: null,
    recentAccuracy: 0.5,
    streak: 0,
    dueAt: null
  }
}

export function getUnlockedTopics(progressByTopic: ReadonlyMap<ExerciseTopic, TopicProgress>) {
  return allTopics.filter((topic) => {
    if (coreTopics.includes(topic)) return true

    const prerequisites = topicPrerequisites[topic] ?? []

    return prerequisites.every((prerequisite) => isTopicReady(progressByTopic.get(prerequisite)))
  })
}

export function selectTopic(
  unlockedTopics: ExerciseTopic[],
  progressByTopic: ReadonlyMap<ExerciseTopic, TopicProgress>,
  now = new Date()
): ExerciseTopic {
  const scoredTopics = unlockedTopics.map((topic) => ({
    topic,
    weight: scoreTopic(topic, progressByTopic.get(topic), now)
  }))
  const totalWeight = scoredTopics.reduce((sum, entry) => sum + entry.weight, 0)
  let threshold = Math.random() * totalWeight

  for (const entry of scoredTopics) {
    threshold -= entry.weight
    if (threshold <= 0) {
      return entry.topic
    }
  }

  return pickRandom(unlockedTopics) ?? coreTopics[0] ?? 'combine-like-terms'
}

export function selectDifficultyBand(topic: ExerciseTopic, progress?: TopicProgress): DifficultyBand {
  if (topic === 'challenge-mixed-expressions') return 5

  const estimatedBand = clampDifficultyBand(Math.round(progress?.skillEstimate ?? 1))
  const roll = Math.random()

  if (roll < 0.2) return clampDifficultyBand(estimatedBand - 1)
  if (roll < 0.9) return estimatedBand
  return clampDifficultyBand(estimatedBand + 1)
}

export function updateTopicProgress(
  previous: TopicProgress,
  input: {
    exercise: ExpressionExercise
    resultReason: AttemptResultReason
    isCorrect: boolean
    latencyMs: number
  },
  now = new Date()
): TopicProgress {
  const accuracy = input.isCorrect ? 1 : 0
  const latencyModifier = input.isCorrect && input.latencyMs < 20_000 ? 0.05 : 0
  const penalty =
    input.resultReason === 'revealed'
      ? -0.35
      : input.resultReason === 'parseError'
        ? -0.2
        : input.resultReason === 'notEquivalent'
          ? -0.4
          : input.isCorrect
            ? 0.22
            : -0.3
  const difficultyPressure = (input.exercise.difficultyBand - previous.skillEstimate) * 0.04
  const skillEstimate = clampSkill(previous.skillEstimate + penalty + latencyModifier + difficultyPressure)
  const streak = input.isCorrect ? previous.streak + 1 : 0
  const recentAccuracy = previous.recentAccuracy * 0.7 + accuracy * 0.3
  const dueAt = new Date(
    now.getTime() +
      (input.isCorrect ? Math.max(2, streak + input.exercise.difficultyBand) : 1) * 60 * 60 * 1000
  )

  return {
    topic: previous.topic,
    skillEstimate,
    lastSeenAt: now.toISOString(),
    recentAccuracy,
    streak,
    dueAt: dueAt.toISOString()
  }
}

function createExerciseAttempt(input: {
  exercise: ExpressionExercise
  answer: string
  resultReason: AttemptResultReason
  isCorrect: boolean
  latencyMs: number
}): ExerciseAttempt {
  const timestamp = new Date().toISOString()
  const exercise = serializeExercise(input.exercise)

  return {
    id: `${exercise.id}:${timestamp}`,
    timestamp,
    exerciseId: exercise.id,
    topic: exercise.topic,
    difficultyBand: exercise.difficultyBand,
    difficultyScore: exercise.difficultyScore,
    features: [...exercise.features],
    source: exercise.source,
    target: exercise.target,
    answer: input.answer,
    resultReason: input.resultReason,
    isCorrect: input.isCorrect,
    latencyMs: input.latencyMs
  }
}

function serializeExercise(exercise: ExpressionExercise): ExpressionExercise {
  return {
    id: exercise.id,
    topic: exercise.topic,
    source: exercise.source,
    target: exercise.target,
    difficultyBand: exercise.difficultyBand,
    difficultyScore: exercise.difficultyScore,
    features: [...exercise.features],
    seed: exercise.seed,
    trace: exercise.trace ? [...exercise.trace] : undefined
  }
}

function isTopicReady(progress?: TopicProgress) {
  return Boolean(progress && progress.skillEstimate >= 2.1 && progress.recentAccuracy >= 0.65)
}

function scoreTopic(topic: ExerciseTopic, progress: TopicProgress | undefined, now: Date) {
  if (!progress) return topic === 'challenge-mixed-expressions' ? 0.2 : 5

  const dueBoost = !progress.dueAt
    ? 3
    : Math.max(0, (now.getTime() - new Date(progress.dueAt).getTime()) / (60 * 60 * 1000))
  const weaknessBoost = Math.max(0, 4 - progress.skillEstimate)
  const instabilityBoost = Math.max(0, 1 - progress.recentAccuracy) * 4

  return 1 + dueBoost + weaknessBoost + instabilityBoost
}

function clampDifficultyBand(value: number): DifficultyBand {
  return Math.max(1, Math.min(4, value)) as DifficultyBand
}

function clampSkill(value: number) {
  return Math.max(1, Math.min(4.5, Number(value.toFixed(2))))
}
