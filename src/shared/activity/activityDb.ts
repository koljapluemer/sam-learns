import { db } from '@/shared/db/db'
import type { EntityTable } from 'dexie'

export type ActivityEventRow = {
  id: string
  appSlug: string
  timestamp: string
}

// One row per app per local day. `ms` accumulates as the app's active-time
// tracker flushes - this is the single sink every app's time-tracking
// (generic idle/focus tracker or bespoke, e.g. video/audio watch time)
// reports into, so the cross-app stats page has one consistent source.
export type ActivityTimeEntryRow = {
  id: string
  appSlug: string
  dayKey: string
  ms: number
}

export const activityDb = {
  activityEvents: db.table('activity_activityEvents') as EntityTable<ActivityEventRow, 'id'>,
  activityTimeEntries: db.table('activity_activityTimeEntries') as EntityTable<ActivityTimeEntryRow, 'id'>
}
