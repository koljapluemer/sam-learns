import { db } from '@/shared/db/db'
import type { EntityTable } from 'dexie'
import type { Card } from 'ts-fsrs'

export type FlashcardRow = {
  id: string
  front: string
  back: string
  createdAt: string
}

export type ScheduleRow = Card & { flashcardId: string }

export const appDb = {
  flashcards: db.table('justFlashcards_flashcards') as EntityTable<FlashcardRow, 'id'>,
  cards: db.table('justFlashcards_cards') as EntityTable<ScheduleRow, 'flashcardId'>
}
