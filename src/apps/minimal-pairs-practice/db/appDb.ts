import { db } from '@/shared/db/db'
import type { EntityTable } from 'dexie'
import type { PracticeEvent } from '../entities/practice-event/types'

// Table stays under the app's old slug (this app was renamed from
// viettonepractice to minimal-pairs-practice) - renaming it would need a
// live Dexie Cloud schema migration for no real benefit.
export const appDb = {
  practiceEvents: db.table('viettonepractice_practiceEvents') as EntityTable<PracticeEvent, 'id'>
}
