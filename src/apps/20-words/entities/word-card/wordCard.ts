import { createEmptyCard, fsrs, type Card, type Grade } from 'ts-fsrs'
import { appDb } from '../../db/appDb'
import { toDayKey } from '../../dumb/dayBoundary'

const scheduler = fsrs()

export async function graduateWord(wordId: string): Promise<void> {
  const card = createEmptyCard(new Date())
  await appDb.wordCards.put({ ...card, wordId })
}

export async function getDueWordCards(now = new Date()): Promise<{ wordId: string; card: Card }[]> {
  const all = await appDb.wordCards.toArray()
  return all.filter((row) => row.due <= now).map(({ wordId, ...card }) => ({ wordId, card }))
}

export async function rateWordCard(wordId: string, existingCard: Card, rating: Grade): Promise<void> {
  const now = new Date()
  const { card } = scheduler.next(existingCard, now, rating)
  await appDb.wordCards.put({ ...card, wordId })

  const timestamp = now.toISOString()
  await appDb.reviewEvents.add({ id: crypto.randomUUID(), wordId, timestamp, dayKey: toDayKey(timestamp) })
}
