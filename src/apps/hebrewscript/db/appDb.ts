import Dexie, { type EntityTable } from 'dexie'
import type { PracticeEvent } from '../app/types'

class HebrewscriptDb extends Dexie {
  practiceEvents!: EntityTable<PracticeEvent, 'id'>

  constructor() {
    super('hebrewscriptDb')

    this.version(1).stores({
      practiceEvents: '++id, timestamp'
    })
  }
}

export const appDb = new HebrewscriptDb()
