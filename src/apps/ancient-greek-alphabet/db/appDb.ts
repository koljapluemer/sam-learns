import { db } from '@/shared/db/db'
import type { EntityTable } from 'dexie'
import type { Card, Grade } from 'ts-fsrs'

export type CardRow = Card & { id: string; lastRating: Grade }

export const appDb = {
  cards: db.table('ancientGreekAlphabet_cards') as EntityTable<CardRow, 'id'>
}
