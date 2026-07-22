import Dexie, { type EntityTable } from 'dexie'
import type { PracticeEvent } from '../app/types'

class VietTonePracticeDb extends Dexie {
  practiceEvents!: EntityTable<PracticeEvent, 'id'>

  constructor() {
    super('viettonepracticeDb')

    this.version(1).stores({
      practiceEvents: '++id, timestamp'
    })
  }
}

export const appDb = new VietTonePracticeDb()
