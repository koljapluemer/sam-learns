import { db } from '@/shared/db/db'
import type { EntityTable } from 'dexie'
import type { Card } from 'ts-fsrs'

export type ScheduleRow = Card & { id: string }

export const appDb = {
  schedules: db.table('phrases_schedules') as EntityTable<ScheduleRow, 'id'>
}
