import { createEmptyCard, fsrs, type Card, type Grade } from 'ts-fsrs'
import { appDb } from '../../db/appDb'

const scheduler = fsrs()

export async function createWordCard(wordId: string, now = new Date()): Promise<void> {
  const card = createEmptyCard(now)
  await appDb.wordCards.put({ ...card, wordId })
}

export async function getDueWordCards(now = new Date()): Promise<{ wordId: string; card: Card }[]> {
  const all = await appDb.wordCards.toArray()
  return all.filter((row) => row.due <= now).map(({ wordId, ...card }) => ({ wordId, card }))
}

export async function getWordCard(wordId: string): Promise<Card | undefined> {
  return appDb.wordCards.get(wordId)
}

export async function rateWordCard(wordId: string, existingCard: Card, rating: Grade): Promise<void> {
  const { card } = scheduler.next(existingCard, new Date(), rating)
  await appDb.wordCards.put({ ...card, wordId })
}

export async function deleteWordCard(wordId: string): Promise<void> {
  await appDb.wordCards.delete(wordId)
}
