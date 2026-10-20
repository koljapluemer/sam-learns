import { db } from '@/shared/db/db'
import type { EntityTable } from 'dexie'
import type { Card } from 'ts-fsrs'

// key = `${youtubeId}::${term}` - shares FSRS state across every snippet
// where a term recurs within one video, isolated from other videos.
export type VocabCardRow = Card & { key: string }

export const appDb = {
  // Kept under the-little-prince's table name (this app replaced it) so
  // existing progress carries over without a Dexie Cloud schema migration.
  vocabCards: db.table('theLittlePrince_vocabCards') as EntityTable<VocabCardRow, 'key'>
}
