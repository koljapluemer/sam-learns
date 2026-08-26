import { createEmptyCard, fsrs, Rating, type Grade } from 'ts-fsrs'
import { appDb, type VocabCardRow } from '../../db/appDb'

const scheduler = fsrs()

export function vocabCardId(languageCode: string, word: string): string {
  return `${languageCode}:${word}`
}

export async function getVocabCards(languageCode: string): Promise<Map<string, VocabCardRow>> {
  const rows = await appDb.vocabCards.toArray()
  const prefix = `${languageCode}:`
  return new Map(rows.filter((row) => row.id.startsWith(prefix)).map((row) => [row.id, row]))
}

export async function createVocabCard(id: string, initialSentence: string, now = new Date()): Promise<void> {
  const card = createEmptyCard(now)
  await appDb.vocabCards.put({ ...card, id, level: 1, initialSentence })
}

function nextLevel(level: VocabCardRow['level'], rating: Grade): VocabCardRow['level'] {
  if (rating === Rating.Easy || rating === Rating.Good) return Math.min(4, level + 1) as VocabCardRow['level']
  if (rating === Rating.Again) return Math.max(1, level - 1) as VocabCardRow['level']
  return level
}

export async function rateVocabCard(id: string, existing: VocabCardRow, rating: Grade): Promise<void> {
  const { card } = scheduler.next(existing, new Date(), rating)
  await appDb.vocabCards.put({
    ...card,
    id,
    level: nextLevel(existing.level, rating),
    initialSentence: existing.initialSentence
  })
}

// Directly overwrites due dates without simulating an FSRS review - used to
// force-refresh vocab whose containing sentence was just answered wrong
// after previously being correct (spec.md's "hack the due date" rule).
export async function setVocabCardsDueNow(ids: string[], now = new Date()): Promise<void> {
  await Promise.all(
    ids.map(async (id) => {
      const existing = await appDb.vocabCards.get(id)
      if (existing) await appDb.vocabCards.update(id, { due: now })
    })
  )
}
