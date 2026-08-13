import { db } from '@/shared/db/db'
import type { EntityTable } from 'dexie'
import type { Card } from 'ts-fsrs'

export type ScenarioProgressRow = Card & { scenarioId: string }

export type LearningEventRow = {
  id: string
  timestamp: string
  scenarioId: string
  rating: number
}

export const appDb = {
  scenarioProgress: db.table('entityRelationIntuition_scenarioProgress') as EntityTable<
    ScenarioProgressRow,
    'scenarioId'
  >,
  learningEvents: db.table('entityRelationIntuition_learningEvents') as EntityTable<LearningEventRow, 'id'>
}
