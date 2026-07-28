import Dexie, { type EntityTable } from 'dexie'
import type { Card } from 'ts-fsrs'

export type SentenceRow = {
  id: string
  text: string
  translation: string
  note: string
  wordIds: string[]
  vocabDone: boolean
  createdAt: string
}

export type WordRow = {
  id: string
  text: string
  translation: string
  note: string
  examplesOptOut: boolean
  createdAt: string
}

export type SentenceCardRow = Card & { sentenceId: string }
export type WordCardRow = Card & { wordId: string }

class SentenceNetDb extends Dexie {
  sentences!: EntityTable<SentenceRow, 'id'>
  words!: EntityTable<WordRow, 'id'>
  sentenceCards!: EntityTable<SentenceCardRow, 'sentenceId'>
  wordCards!: EntityTable<WordCardRow, 'wordId'>

  constructor() {
    super('sentenceNetDb')

    this.version(1).stores({
      sentences: 'id, *wordIds',
      words: 'id',
      sentenceCards: 'sentenceId',
      wordCards: 'wordId'
    })
  }
}

export const appDb = new SentenceNetDb()
