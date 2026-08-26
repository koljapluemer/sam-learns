import { db } from '@/shared/db/db'
import type { EntityTable } from 'dexie'
import type { Card } from 'ts-fsrs'

export type VocabCardRow = Card & { id: string; level: 1 | 2 | 3 | 4; initialSentence: string }
export type SentenceCardRow = Card & { id: string; lastAnswerCorrect: boolean }

export const appDb = {
  vocabCards: db.table('topVocab_vocabCards') as EntityTable<VocabCardRow, 'id'>,
  sentenceCards: db.table('topVocab_sentenceCards') as EntityTable<SentenceCardRow, 'id'>
}
