import { appDb, makeGapKey, type ClozeGapProgressRow, type LearningEventRow, type TopicProgressRow } from '@/apps/triangle-congruence/db/appDb'
import type { TriangleTheorem } from '../triangle/triangleTypes'
// shared cross-cutting infra, see docs/adding-an-app.md
import { logActivity } from '@/shared/activity/useLearningEvent'

const memoryState = {
  topicProgress: new Map<TriangleTheorem, TopicProgressRow>(),
  clozeGapProgress: new Map<string, ClozeGapProgressRow>(),
  learningEvents: [] as LearningEventRow[]
}

function hasIndexedDb() {
  return typeof indexedDB !== 'undefined'
}

export async function listTopicProgress(): Promise<TopicProgressRow[]> {
  if (!hasIndexedDb()) {
    return [...memoryState.topicProgress.values()]
  }
  return appDb.topicProgress.toArray()
}

export async function getTopicProgress(topicId: TriangleTheorem): Promise<TopicProgressRow | undefined> {
  if (!hasIndexedDb()) {
    return memoryState.topicProgress.get(topicId)
  }
  return appDb.topicProgress.get(topicId)
}

export async function getClozeGapProgress(topicId: TriangleTheorem, gapIndex: number): Promise<ClozeGapProgressRow | undefined> {
  const gapKey = makeGapKey(topicId, gapIndex)
  if (!hasIndexedDb()) {
    return memoryState.clozeGapProgress.get(gapKey)
  }
  return appDb.clozeGapProgress.get(gapKey)
}

export async function saveTopicProgressAndEvent(topicRow: TopicProgressRow, event: LearningEventRow): Promise<void> {
  if (!hasIndexedDb()) {
    memoryState.topicProgress.set(topicRow.topicId, topicRow)
    memoryState.learningEvents.push(event)
    await logActivity('triangle-congruence')
    return
  }

  await appDb.transaction('rw', appDb.topicProgress, appDb.learningEvents, async () => {
    await appDb.topicProgress.put(topicRow)
    await appDb.learningEvents.add(event)
  })
  await logActivity('triangle-congruence')
}

export async function saveClozeGapProgressAndEvent(
  gapRow: ClozeGapProgressRow,
  topicRow: TopicProgressRow,
  event: LearningEventRow
): Promise<void> {
  if (!hasIndexedDb()) {
    memoryState.clozeGapProgress.set(gapRow.gapKey, gapRow)
    memoryState.topicProgress.set(topicRow.topicId, topicRow)
    memoryState.learningEvents.push(event)
    await logActivity('triangle-congruence')
    return
  }

  await appDb.transaction('rw', appDb.clozeGapProgress, appDb.topicProgress, appDb.learningEvents, async () => {
    await appDb.clozeGapProgress.put(gapRow)
    await appDb.topicProgress.put(topicRow)
    await appDb.learningEvents.add(event)
  })
  await logActivity('triangle-congruence')
}

export function resetProgressRepositoryForTests() {
  memoryState.topicProgress.clear()
  memoryState.clozeGapProgress.clear()
  memoryState.learningEvents = []
}
