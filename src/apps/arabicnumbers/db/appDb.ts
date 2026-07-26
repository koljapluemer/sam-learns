import Dexie, { type EntityTable } from 'dexie'
import type { StoredExerciseState, StoredNumberState } from '../app/types'

class ArabicNumbersDb extends Dexie {
  numberState!: EntityTable<StoredNumberState, 'val'>
  exercises!: EntityTable<StoredExerciseState, 'key'>

  constructor() {
    super('arabicnumbersDb')

    this.version(1).stores({
      numberState: 'val',
      exercises: 'key',
      missions: 'id'
    })

    // Missions feature removed - drop the now-unused table.
    this.version(2).stores({
      numberState: 'val',
      exercises: 'key',
      missions: null
    })
  }
}

export const appDb = new ArabicNumbersDb()
