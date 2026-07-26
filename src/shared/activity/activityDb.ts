import Dexie, { type EntityTable } from 'dexie'

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

class ActivityDb extends Dexie {
  activityEvents!: EntityTable<ActivityEventRow, 'id'>
  activityTimeEntries!: EntityTable<ActivityTimeEntryRow, 'id'>

  constructor() {
    super('samlearnsActivityDb')

    this.version(1).stores({
      activityEvents: 'id, appSlug, timestamp'
    })

    this.version(2).stores({
      activityEvents: 'id, appSlug, timestamp',
      activityTimeEntries: 'id, appSlug, dayKey'
    })
  }
}

export const activityDb = new ActivityDb()
