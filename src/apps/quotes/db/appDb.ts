import { db } from '@/shared/db/db'
import type { EntityTable } from 'dexie'
import type { Card } from 'ts-fsrs'

export type QuoteRow = {
  id: string
  content: string
  attribution: string
  createdAt: string
}

export type QuoteClozeCardRow = Card & { id: string; quoteId: string; level: number }

export const appDb = {
  quotes: db.table('quotes_quotes') as EntityTable<QuoteRow, 'id'>,
  quoteClozeCards: db.table('quotes_quoteClozeCards') as EntityTable<QuoteClozeCardRow, 'id'>
}
