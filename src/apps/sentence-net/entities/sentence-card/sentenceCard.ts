import { createEmptyCard, fsrs, type Card, type Grade } from 'ts-fsrs'
import { appDb } from '../../db/appDb'

const scheduler = fsrs()

export async function createSentenceCard(sentenceId: string, now = new Date()): Promise<void> {
  const card = createEmptyCard(now)
  await appDb.sentenceCards.put({ ...card, sentenceId })
}

export async function getDueSentenceCards(now = new Date()): Promise<{ sentenceId: string; card: Card }[]> {
  const all = await appDb.sentenceCards.toArray()
  return all.filter((row) => row.due <= now).map(({ sentenceId, ...card }) => ({ sentenceId, card }))
}

export async function getSentenceCard(sentenceId: string): Promise<Card | undefined> {
  return appDb.sentenceCards.get(sentenceId)
}

export async function rateSentenceCard(sentenceId: string, existingCard: Card, rating: Grade): Promise<void> {
  const { card } = scheduler.next(existingCard, new Date(), rating)
  await appDb.sentenceCards.put({ ...card, sentenceId })
}

export async function deleteSentenceCard(sentenceId: string): Promise<void> {
  await appDb.sentenceCards.delete(sentenceId)
}
