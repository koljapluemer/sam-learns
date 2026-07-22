import Dexie, { type EntityTable } from 'dexie'
import type { Missions, StoredExerciseState, StoredNumberState } from '../app/types'

type MissionsRow = { id: 'missions'; value: Missions }

class ArabicNumbersDb extends Dexie {
  numberState!: EntityTable<StoredNumberState, 'val'>
  exercises!: EntityTable<StoredExerciseState, 'key'>
  missions!: EntityTable<MissionsRow, 'id'>

  constructor() {
    super('arabicnumbersDb')

    this.version(1).stores({
      numberState: 'val',
      exercises: 'key',
      missions: 'id'
    })
  }
}

export const appDb = new ArabicNumbersDb()
