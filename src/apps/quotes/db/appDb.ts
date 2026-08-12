import Dexie, { type EntityTable } from 'dexie'
import type { Card } from 'ts-fsrs'

export type QuoteRow = {
  id: string
  content: string
  attribution: string
  createdAt: string
}

export type QuoteClozeCardRow = Card & { id: string; quoteId: string; level: number }

class QuotesDb extends Dexie {
  quotes!: EntityTable<QuoteRow, 'id'>
  quoteClozeCards!: EntityTable<QuoteClozeCardRow, 'id'>

  constructor() {
    super('quotesDb')

    this.version(1).stores({
      quotes: 'id',
      quoteClozeCards: 'id, quoteId'
    })
  }
}

export const appDb = new QuotesDb()
