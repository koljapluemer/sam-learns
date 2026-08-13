import { db } from '@/shared/db/db'
import type { EntityTable } from 'dexie'
import type {
  ExerciseAttempt,
  TopicProgress
} from '@/apps/simplify-expressions/entities/expression-exercise/exerciseTypes'

export const appDb = {
  exerciseAttempts: db.table('simplifyExpressions_exerciseAttempts') as EntityTable<ExerciseAttempt, 'id'>,
  topicProgress: db.table('simplifyExpressions_topicProgress') as EntityTable<TopicProgress, 'topic'>
}
