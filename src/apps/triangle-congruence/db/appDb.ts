import Dexie, { type EntityTable } from 'dexie'
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

class TriangleCongruenceDb extends Dexie {
  topicProgress!: EntityTable<TopicProgressRow, 'topicId'>
  clozeGapProgress!: EntityTable<ClozeGapProgressRow, 'gapKey'>
  learningEvents!: EntityTable<LearningEventRow, 'id'>

  constructor() {
    super('triangleCongruenceDb')

    this.version(1).stores({
      topicProgress: 'topicId',
      clozeGapProgress: 'gapKey, topicId',
      learningEvents: 'id, timestamp, topicId'
    })
  }
}

export const appDb = new TriangleCongruenceDb()

export function makeGapKey(topicId: TriangleTheorem, gapIndex: number): string {
  return `${topicId}:${gapIndex}`
}
