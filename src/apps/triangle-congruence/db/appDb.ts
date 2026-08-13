import { db } from '@/shared/db/db'
import type { EntityTable } from 'dexie'
import type { TriangleTheorem } from '@/apps/triangle-congruence/entities/triangle/triangleTypes'

export type TopicProgressRow = {
  topicId: TriangleTheorem
  streak: number
  highestAchievedStreak: number
}

export type ClozeGapProgressRow = {
  gapKey: string
  topicId: TriangleTheorem
  gapIndex: number
  streak: number
}

export type LearningEventRow = {
  id: string
  timestamp: string
  topicId: TriangleTheorem
  exerciseType: 'identify-theorem' | 'cloze'
  gapIndex?: number
  streakAfterAnswer: number
  possibleAnswers: string[]
  answerGiven: string
}

export const appDb = {
  topicProgress: db.table('triangleCongruence_topicProgress') as EntityTable<TopicProgressRow, 'topicId'>,
  clozeGapProgress: db.table('triangleCongruence_clozeGapProgress') as EntityTable<ClozeGapProgressRow, 'gapKey'>,
  learningEvents: db.table('triangleCongruence_learningEvents') as EntityTable<LearningEventRow, 'id'>
}

export function makeGapKey(topicId: TriangleTheorem, gapIndex: number): string {
  return `${topicId}:${gapIndex}`
}
