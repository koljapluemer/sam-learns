import { db } from '@/shared/db/db'
import type { EntityTable } from 'dexie'
import type { Card } from 'ts-fsrs'

// key = `${youtubeId}::${term}` - shares FSRS state across every segment
// where a term recurs within one video, isolated from other videos.
export type VocabCardRow = Card & { key: string }

export const appDb = {
  vocabCards: db.table('theLittlePrince_vocabCards') as EntityTable<VocabCardRow, 'key'>
}
