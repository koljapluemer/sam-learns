import { createEmptyCard, fsrs, type Card, type Grade } from 'ts-fsrs'
import { appDb } from '../../db/appDb'

const scheduler = fsrs()

// One schedule per (language, communication goal, expression) - the
// target-language expression is the atomic learning item, since the same
// goal can have several expressions for different contexts (e.g. formal
// vs informal).
export function expressionCardId(languageCode: string, goalKey: string, expressionText: string): string {
  return `${languageCode}:${goalKey}:${expressionText}`
}

export async function getSchedules(): Promise<Map<string, Card>> {
  const rows = await appDb.schedules.toArray()
  return new Map(rows.map(({ id, ...card }) => [id, card]))
}

export async function rateExpression(id: string, existing: Card | undefined, rating: Grade): Promise<void> {
  const { card } = scheduler.next(existing ?? createEmptyCard(new Date()), new Date(), rating)
  await appDb.schedules.put({ ...card, id })
}
