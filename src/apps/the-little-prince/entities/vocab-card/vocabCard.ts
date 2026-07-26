import { createEmptyCard, fsrs, type Card, type Grade } from 'ts-fsrs'
import { appDb } from '../../db/appDb'

const scheduler = fsrs()

export function buildVocabKey(youtubeId: string, term: string): string {
  return `${youtubeId}::${term}`
}

export async function getVocabCardsByKeys(keys: string[]): Promise<Map<string, Card>> {
  const rows = await appDb.vocabCards.bulkGet(keys)
  const cardsByKey = new Map<string, Card>()
  rows.forEach((row, index) => {
    if (row) cardsByKey.set(keys[index], row)
  })
  return cardsByKey
}

export async function rateVocabCard(key: string, existingCard: Card | undefined, rating: Grade): Promise<Card> {
  const now = new Date()
  const { card } = scheduler.next(existingCard ?? createEmptyCard(now), now, rating)
  await appDb.vocabCards.put({ ...card, key })
  return card
}
