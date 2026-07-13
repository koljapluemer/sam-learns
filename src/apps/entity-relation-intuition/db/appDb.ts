import Dexie, { type EntityTable } from 'dexie'
import type { Card } from 'ts-fsrs'

export type ScenarioProgressRow = Card & { scenarioId: string }

export type LearningEventRow = {
  id: string
  timestamp: string
  scenarioId: string
  rating: number
}

class EntityRelationIntuitionDb extends Dexie {
  scenarioProgress!: EntityTable<ScenarioProgressRow, 'scenarioId'>
  learningEvents!: EntityTable<LearningEventRow, 'id'>

  constructor() {
    super('entityRelationIntuitionDb')

    this.version(1).stores({
      scenarioProgress: 'scenarioId',
      learningEvents: 'id, timestamp, scenarioId'
    })
  }
}

export const appDb = new EntityRelationIntuitionDb()
