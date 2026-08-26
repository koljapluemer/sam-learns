import { createEmptyCard, fsrs, Rating, type Grade } from 'ts-fsrs'
import { appDb, type SentenceCardRow } from '../../db/appDb'

const scheduler = fsrs()

export function sentenceCardId(languageCode: string, text: string): string {
  return `${languageCode}:${text}`
}

export async function getSentenceCards(languageCode: string): Promise<Map<string, SentenceCardRow>> {
  const rows = await appDb.sentenceCards.toArray()
  const prefix = `${languageCode}:`
  return new Map(rows.filter((row) => row.id.startsWith(prefix)).map((row) => [row.id, row]))
}

export async function createSentenceCard(id: string, now = new Date()): Promise<void> {
  const card = createEmptyCard(now)
  await appDb.sentenceCards.put({ ...card, id, lastAnswerCorrect: false })
}

export async function rateSentenceCard(id: string, existing: SentenceCardRow, rating: Grade): Promise<void> {
  const { card } = scheduler.next(existing, new Date(), rating)
  const lastAnswerCorrect = rating === Rating.Good || rating === Rating.Easy
  await appDb.sentenceCards.put({ ...card, id, lastAnswerCorrect })
}
