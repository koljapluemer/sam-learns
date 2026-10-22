import { db } from '@/shared/db/db'
import type { EntityTable } from 'dexie'
import type { Card } from 'ts-fsrs'

// key = `${youtubeId}::${term}` - shares FSRS state across every snippet
// where a term recurs within one video, isolated from other videos.
export type VocabCardRow = Card & { key: string }

// Written when a snippet finishes playing; the reflection fields are
// filled in once the learner answers.
export type SnippetViewRow = {
  id: string
  youtubeId: string
  snippetId: string
  watchedAt: Date
  question?: string
  answer?: string
  ratingQuestion?: string
  rating?: number
}

export const appDb = {
  // Kept under the-little-prince's table name (this app replaced it) so
  // existing progress carries over without a Dexie Cloud schema migration.
  vocabCards: db.table('theLittlePrince_vocabCards') as EntityTable<VocabCardRow, 'key'>,
  snippetViews: db.table('withVideos_snippetViews') as EntityTable<SnippetViewRow, 'id'>
}
