import { createEmptyCard, fsrs, type Card, type Grade } from 'ts-fsrs'
import { appDb } from '../../db/appDb'

const scheduler = fsrs()

export async function getSchedules(): Promise<Map<string, Card>> {
  const rows = await appDb.cards.toArray()
  return new Map(rows.map(({ flashcardId, ...card }) => [flashcardId, card]))
}

export async function rateFlashcard(flashcardId: string, existing: Card | undefined, rating: Grade): Promise<void> {
  const { card } = scheduler.next(existing ?? createEmptyCard(new Date()), new Date(), rating)
  await appDb.cards.put({ ...card, flashcardId })
}
