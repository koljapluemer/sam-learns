import { db } from '@/shared/db/db'
import type { EntityTable } from 'dexie'
import type { Card } from 'ts-fsrs'

export type SentenceRow = {
  id: string
  text: string
  translation: string
  note: string
  language: string
  wordIds: string[]
  vocabDone: boolean
  createdAt: string
}

export type WordRow = {
  id: string
  text: string
  translation: string
  note: string
  language: string
  examplesOptOut: boolean
  createdAt: string
}

export type SentenceCardRow = Card & { sentenceId: string }
export type WordCardRow = Card & { wordId: string }

export const appDb = {
  sentences: db.table('sentenceNet_sentences') as EntityTable<SentenceRow, 'id'>,
  words: db.table('sentenceNet_words') as EntityTable<WordRow, 'id'>,
  sentenceCards: db.table('sentenceNet_sentenceCards') as EntityTable<SentenceCardRow, 'sentenceId'>,
  wordCards: db.table('sentenceNet_wordCards') as EntityTable<WordCardRow, 'wordId'>
}
