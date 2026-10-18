import { createEmptyCard, fsrs, Rating, type Grade } from 'ts-fsrs'
import { appDb, type CardRow } from '../../db/appDb'

const scheduler = fsrs()

// Unseen cards, or ones last rated Hard/Again, count as "struggling" - they
// show the image on the front as a hint.
export function isStruggling(card: CardRow | undefined): boolean {
  return !card || card.lastRating <= Rating.Hard
}

export async function getCards(): Promise<Map<string, CardRow>> {
  const rows = await appDb.cards.toArray()
  return new Map(rows.map((row) => [row.id, row]))
}

// Switching between struggling and not makes the card due right away, so the
// user practices it again with/without the image hint.
export async function rateCard(id: string, existing: CardRow | undefined, rating: Grade): Promise<void> {
  const now = new Date()
  const { card } = scheduler.next(existing ?? createEmptyCard(now), now, rating)
  const next: CardRow = { ...card, id, lastRating: rating }
  if (isStruggling(existing) !== isStruggling(next)) next.due = now
  await appDb.cards.put(next)
}
