import Dexie, { type EntityTable } from 'dexie'
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
  createdAt: string
  dayKey: string
  memorizeRow: number | null
  memorizeSeq: number | null
  memorized: boolean
  memorizedAt: string | null
}

export type WordCardRow = Card & { wordId: string }

export type ReviewEventRow = { id: string; wordId: string; timestamp: string; dayKey: string }

class TwentyWordsDb extends Dexie {
  words!: EntityTable<WordRow, 'id'>
  wordCards!: EntityTable<WordCardRow, 'wordId'>
  reviewEvents!: EntityTable<ReviewEventRow, 'id'>

  constructor() {
    super('twentyWordsDb')

    this.version(1).stores({
      words: 'id, dayKey',
      wordCards: 'wordId',
      reviewEvents: 'id, dayKey'
    })
  }
}

export const appDb = new TwentyWordsDb()
