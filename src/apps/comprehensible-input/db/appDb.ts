import { db } from '@/shared/db/db'
import type { EntityTable } from 'dexie'
import type { DailyWatchTimeRow, SurveyResponse, WatchRecord } from '../app/types'

export type SessionRow = SurveyResponse & { id: string }

export const appDb = {
  watchTime: db.table('comprehensibleInput_watchTime') as EntityTable<WatchRecord, 'videoId'>,
  sessions: db.table('comprehensibleInput_sessions') as EntityTable<SessionRow, 'id'>,
  dailyWatchTime: db.table('comprehensibleInput_dailyWatchTime') as EntityTable<DailyWatchTimeRow, 'id'>
}
