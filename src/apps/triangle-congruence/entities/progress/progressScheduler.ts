import { buildClozeExercise } from '../cloze/clozeExerciseBuilder'
import { pickDueGapIndex, pickRandomClozeTemplateForTopic } from '../cloze/clozeGeneration'
import type { ClozeExercise } from '../cloze/clozeTypes'
import { generateIdentifyTheoremExercise } from '../triangle/triangleGenerators'
import type { IdentifyTheoremExercise, TriangleTheorem } from '../triangle/triangleTypes'
import { pickRandom } from '../../dumb/random'
import {
  getClozeGapProgress,
  getTopicProgress,
  listTopicProgress,
  saveClozeGapProgressAndEvent,
  saveTopicProgressAndEvent
} from './progressRepository'
import { makeGapKey, type ClozeGapProgressRow, type LearningEventRow, type TopicProgressRow } from '@/apps/triangle-congruence/db/appDb'

export const allTheorems: TriangleTheorem[] = ['sss', 'sws', 'wsw', 'ssw']
export const LEARNED_STREAK_THRESHOLD = 3
export const EXPLANATIONS_VISIBLE_UP_TO_STREAK = 5

export function determineAllTheoremsLearned(progressByTopic: Map<TriangleTheorem, TopicProgressRow>): boolean {
  return allTheorems.every((topic) => (progressByTopic.get(topic)?.streak ?? 0) >= LEARNED_STREAK_THRESHOLD)
}

export function pickDueTopic(topics: TriangleTheorem[] = allTheorems): TriangleTheorem {
  return pickRandom(topics)
}

export function pickExerciseKind(): 'identify-theorem' | 'cloze' {
  return Math.random() < 0.5 ? 'identify-theorem' : 'cloze'
}

export function pickPositiveFeedbackMessageIndex(): number {
  return Math.floor(Math.random() * 5)
}

export type NextExerciseState =
  | { kind: 'all-learned' }
  | { kind: 'identify-theorem'; topicId: TriangleTheorem; showExplanations: boolean; exercise: IdentifyTheoremExercise }
  | { kind: 'cloze'; topicId: TriangleTheorem; exercise: ClozeExercise }

function buildIdentifyTheoremState(topicId: TriangleTheorem, progress: TopicProgressRow | undefined): NextExerciseState {
  const showExplanations = !progress || progress.streak <= EXPLANATIONS_VISIBLE_UP_TO_STREAK
  return { kind: 'identify-theorem', topicId, showExplanations, exercise: generateIdentifyTheoremExercise(topicId) }
}

export async function loadNextExercise(noDistractorFallback: string): Promise<NextExerciseState> {
  const progressRows = await listTopicProgress()
  const progressByTopic = new Map(progressRows.map((row) => [row.topicId, row]))

  if (determineAllTheoremsLearned(progressByTopic)) {
    return { kind: 'all-learned' }
  }

  const topicId = pickDueTopic()
  const kind = pickExerciseKind()

  if (kind === 'identify-theorem') {
    return buildIdentifyTheoremState(topicId, progressByTopic.get(topicId))
  }

  const template = pickRandomClozeTemplateForTopic(topicId)
  if (!template) {
    return buildIdentifyTheoremState(topicId, progressByTopic.get(topicId))
  }

  const gapIndex = pickDueGapIndex(template.possibleGapIndices)
  const gapProgress = await getClozeGapProgress(topicId, gapIndex)
  const exercise = buildClozeExercise(template, gapIndex, gapProgress?.streak ?? 0, noDistractorFallback)

  return { kind: 'cloze', topicId, exercise }
}

export async function submitIdentifyTheoremAnswer(input: {
  topicId: TriangleTheorem
  selectedTheorem: TriangleTheorem
}): Promise<{ newStreak: number; isCorrect: boolean }> {
  const isCorrect = input.selectedTheorem === input.topicId
  const current = await getTopicProgress(input.topicId)
  const newStreak = isCorrect ? (current?.streak ?? 0) + 1 : 0
  const newHighest = Math.max(current?.highestAchievedStreak ?? 0, newStreak)

  const topicRow: TopicProgressRow = { topicId: input.topicId, streak: newStreak, highestAchievedStreak: newHighest }
  const event: LearningEventRow = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    topicId: input.topicId,
    exerciseType: 'identify-theorem',
    streakAfterAnswer: newStreak,
    possibleAnswers: [...allTheorems],
    answerGiven: input.selectedTheorem
  }

  await saveTopicProgressAndEvent(topicRow, event)
  return { newStreak, isCorrect }
}

export async function submitClozeAnswer(input: {
  topicId: TriangleTheorem
  gapIndex: number
  answerGiven: string
  possibleAnswers: string[]
  isCorrect: boolean
}): Promise<{ newTopicStreak: number; newGapStreak: number }> {
  const [currentTopic, currentGap] = await Promise.all([
    getTopicProgress(input.topicId),
    getClozeGapProgress(input.topicId, input.gapIndex)
  ])

  const newTopicStreak = input.isCorrect ? (currentTopic?.streak ?? 0) + 1 : 0
  const newTopicHighest = Math.max(currentTopic?.highestAchievedStreak ?? 0, newTopicStreak)
  const newGapStreak = input.isCorrect ? (currentGap?.streak ?? 0) + 1 : 0

  const topicRow: TopicProgressRow = { topicId: input.topicId, streak: newTopicStreak, highestAchievedStreak: newTopicHighest }
  const gapRow: ClozeGapProgressRow = {
    gapKey: makeGapKey(input.topicId, input.gapIndex),
    topicId: input.topicId,
    gapIndex: input.gapIndex,
    streak: newGapStreak
  }
  const event: LearningEventRow = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    topicId: input.topicId,
    exerciseType: 'cloze',
    gapIndex: input.gapIndex,
    streakAfterAnswer: newGapStreak,
    possibleAnswers: input.possibleAnswers,
    answerGiven: input.answerGiven
  }

  await saveClozeGapProgressAndEvent(gapRow, topicRow, event)
  return { newTopicStreak, newGapStreak }
}
