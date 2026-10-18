import { db } from '@/shared/db/db'
import type { EntityTable } from 'dexie'
import type { StoredExerciseState, StoredNumberState } from '../app/types'

export const appDb = {
  numberState: db.table('arabicnumbers_numberLevels') as EntityTable<StoredNumberState, 'key'>,
  exercises: db.table('arabicnumbers_exercises') as EntityTable<StoredExerciseState, 'key'>
}
