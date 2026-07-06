import Dexie, { type EntityTable } from 'dexie'
import type {
  ExerciseAttempt,
  TopicProgress
} from '@/apps/simplify-expressions/entities/expression-exercise/exerciseTypes'

class SimplifyExpressionsDb extends Dexie {
  exerciseAttempts!: EntityTable<ExerciseAttempt, 'id'>
  topicProgress!: EntityTable<TopicProgress, 'topic'>

  constructor() {
    super('simplifyExpressionsDb')

    this.version(1).stores({
      exerciseAttempts: 'id, timestamp, topic, difficultyBand',
      topicProgress: 'topic, dueAt, lastSeenAt'
    })
  }
}

export const appDb = new SimplifyExpressionsDb()
