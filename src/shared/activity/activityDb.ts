import Dexie, { type EntityTable } from 'dexie'

export type ActivityEventRow = {
  id: string
  appSlug: string
  timestamp: string
}

class ActivityDb extends Dexie {
  activityEvents!: EntityTable<ActivityEventRow, 'id'>

  constructor() {
    super('samlearnsActivityDb')

    this.version(1).stores({
      activityEvents: 'id, appSlug, timestamp'
    })
  }
}

export const activityDb = new ActivityDb()
