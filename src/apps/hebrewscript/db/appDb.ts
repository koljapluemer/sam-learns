import { db } from '@/shared/db/db'
import type { EntityTable } from 'dexie'
import type { PracticeEvent } from '../app/types'

export const appDb = {
  practiceEvents: db.table('hebrewscript_practiceEvents') as EntityTable<PracticeEvent, 'id'>
}
