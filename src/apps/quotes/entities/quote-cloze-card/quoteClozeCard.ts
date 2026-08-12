import { createEmptyCard, fsrs, type Card, type Grade } from 'ts-fsrs'
import { appDb } from '../../db/appDb'

const scheduler = fsrs()

function clozeCardId(quoteId: string, level: number): string {
  return `${quoteId}:${level}`
}

export async function getAllClozeCards(): Promise<{ quoteId: string; level: number; card: Card }[]> {
  const rows = await appDb.quoteClozeCards.toArray()
  return rows.map((row) => ({ quoteId: row.quoteId, level: row.level, card: row }))
}

export async function rateClozeCard(
  quoteId: string,
  level: number,
  existingCard: Card | undefined,
  rating: Grade
): Promise<void> {
  const base = existingCard ?? createEmptyCard(new Date())
  const { card } = scheduler.next(base, new Date(), rating)
  await appDb.quoteClozeCards.put({ ...card, id: clozeCardId(quoteId, level), quoteId, level })
}
