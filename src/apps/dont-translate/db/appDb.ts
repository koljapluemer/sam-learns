import { db } from '@/shared/db/db'
import type { EntityTable } from 'dexie'
import type { Card } from 'ts-fsrs'

export type CardRow = Card & { id: string }

export const appDb = {
  cards: db.table('dontTranslate_cards') as EntityTable<CardRow, 'id'>
}
