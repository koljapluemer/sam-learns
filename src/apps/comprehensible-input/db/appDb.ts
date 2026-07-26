import Dexie, { type EntityTable } from 'dexie'
import type { DailyWatchTimeRow, SurveyResponse, WatchRecord } from '../app/types'

type SessionRow = SurveyResponse & { id: number }

class ComprehensibleInputDb extends Dexie {
  watchTime!: EntityTable<WatchRecord, 'videoId'>
  sessions!: EntityTable<SessionRow, 'id'>
  dailyWatchTime!: EntityTable<DailyWatchTimeRow, 'id'>

  constructor() {
    super('comprehensibleInputDb')

    this.version(1).stores({
      watchTime: 'videoId',
      sessions: '++id'
    })

    this.version(2).stores({
      watchTime: 'videoId',
      sessions: '++id',
      dailyWatchTime: 'id, dayKey, languageName'
    })
  }
}

export const appDb = new ComprehensibleInputDb()
