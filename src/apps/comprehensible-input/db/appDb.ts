import Dexie, { type EntityTable } from 'dexie'
import type { SurveyResponse, WatchRecord } from '../app/types'

type SessionRow = SurveyResponse & { id: number }

class ComprehensibleInputDb extends Dexie {
  watchTime!: EntityTable<WatchRecord, 'videoId'>
  sessions!: EntityTable<SessionRow, 'id'>

  constructor() {
    super('comprehensibleInputDb')

    this.version(1).stores({
      watchTime: 'videoId',
      sessions: '++id'
    })
  }
}

export const appDb = new ComprehensibleInputDb()
