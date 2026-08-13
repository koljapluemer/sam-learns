import { db } from '@/shared/db/db'
import type { EntityTable } from 'dexie'
import type { Card } from 'ts-fsrs'

export type ExampleRow = { sentence: string; translation: string }
export type NoteRow = { text: string }

export type WordRow = {
  id: string
  language: string
  word: string
  meaning: string
  examples: ExampleRow[]
  notes: NoteRow[]
  doodle: string | null
  createdAt: string
  dayKey: string
  memorizeRow: number | null
  memorizeSeq: number | null
  memorized: boolean
  memorizedAt: string | null
}

export type WordCardRow = Card & { wordId: string }

export type ReviewEventRow = { id: string; wordId: string; timestamp: string; dayKey: string }

export const appDb = {
  words: db.table('twentyWords_words') as EntityTable<WordRow, 'id'>,
  wordCards: db.table('twentyWords_wordCards') as EntityTable<WordCardRow, 'wordId'>,
  reviewEvents: db.table('twentyWords_reviewEvents') as EntityTable<ReviewEventRow, 'id'>
}
