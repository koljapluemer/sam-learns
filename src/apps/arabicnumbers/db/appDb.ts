import { db } from '@/shared/db/db'
import type { EntityTable } from 'dexie'
import type { StoredExerciseState, StoredNumberState } from '../app/types'

export const appDb = {
  numberState: db.table('arabicnumbers_numberState') as EntityTable<StoredNumberState, 'val'>,
  exercises: db.table('arabicnumbers_exercises') as EntityTable<StoredExerciseState, 'key'>
}
