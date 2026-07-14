import { createEmptyCard, fsrs, type Card, type Rating } from 'ts-fsrs'
import { appDb } from '@/apps/entity-relation-intuition/db/appDb'
import { getScenarios, type Scenario } from '@/apps/entity-relation-intuition/entities/scenario-content/scenarioContent'
// shared cross-cutting infra, see docs/adding-an-app.md
import { logActivity } from '@/shared/activity/useLearningEvent'

const scheduler = fsrs()

function isDue(card: Card, now: Date): boolean {
  return card.due <= now
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

export async function loadNextScenario(): Promise<Scenario | undefined> {
  const scenarios = await getScenarios()
  if (scenarios.length === 0) return undefined

  const progressRows = await appDb.scenarioProgress.toArray()
  const progressById = new Map(progressRows.map((row) => [row.scenarioId, row]))
  const now = new Date()

  const fresh = scenarios.filter((scenario) => !progressById.has(scenario.id))
  if (fresh.length > 0) return pickRandom(fresh)

  const due = scenarios.filter((scenario) => isDue(progressById.get(scenario.id)!, now))
  if (due.length > 0) return pickRandom(due)

  const byLowestRetention = [...scenarios].sort((a, b) => {
    const retentionA = scheduler.get_retrievability(progressById.get(a.id)!, now, false)
    const retentionB = scheduler.get_retrievability(progressById.get(b.id)!, now, false)
    return retentionA - retentionB
  })
  return byLowestRetention[0]
}

export async function submitRating(scenarioId: string, rating: Rating): Promise<void> {
  const now = new Date()
  const existing = await appDb.scenarioProgress.get(scenarioId)
  const card = existing ?? createEmptyCard(now)
  const { card: nextCard } = scheduler.next(card, now, rating)

  await Promise.all([
    appDb.scenarioProgress.put({ ...nextCard, scenarioId }),
    appDb.learningEvents.add({
      id: crypto.randomUUID(),
      timestamp: now.toISOString(),
      scenarioId,
      rating
    })
  ])

  await logActivity('entity-relation-intuition')
}
