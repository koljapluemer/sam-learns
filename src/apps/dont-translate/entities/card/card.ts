// Each flashcard yields two FSRS cards per language: word-to-image (w2i) and
// image-to-word (i2w).
import { createEmptyCard, fsrs, type Grade } from 'ts-fsrs'
import { appDb, type CardRow } from '../../db/appDb'

export type Direction = 'w2i' | 'i2w'

const scheduler = fsrs()

export function cardId(languageCode: string, flashcardId: string, direction: Direction): string {
  return `${languageCode}:${flashcardId}:${direction}`
}

export async function getCards(languageCode: string): Promise<Map<string, CardRow>> {
  const prefix = `${languageCode}:`
  const rows = await appDb.cards.filter((row) => row.id.startsWith(prefix)).toArray()
  return new Map(rows.map((row) => [row.id, row]))
}

export async function createCard(id: string): Promise<void> {
  await appDb.cards.put({ ...createEmptyCard(new Date()), id })
}

export async function rateCard(existing: CardRow, rating: Grade): Promise<void> {
  const { card } = scheduler.next(existing, new Date(), rating)
  await appDb.cards.put({ ...card, id: existing.id })
}
