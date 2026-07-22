import Dexie, { type EntityTable } from 'dexie'
import type { Card } from 'ts-fsrs'

export type WordCardRow = Card & { wordKey: string }

class BoringWordsDb extends Dexie {
  wordCards!: EntityTable<WordCardRow, 'wordKey'>

  constructor() {
    super('boringwordsDb')

    this.version(1).stores({
      wordCards: 'wordKey'
    })
  }
}

export const appDb = new BoringWordsDb()
