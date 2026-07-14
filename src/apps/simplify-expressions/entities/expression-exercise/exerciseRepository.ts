import { appDb } from '@/apps/simplify-expressions/db/appDb'
import type { ExerciseAttempt, TopicProgress } from './exerciseTypes'
// shared cross-cutting infra, see docs/adding-an-app.md
import { logActivity } from '@/shared/activity/useLearningEvent'

const memoryState = {
  exerciseAttempts: [] as ExerciseAttempt[],
  topicProgress: new Map<TopicProgress['topic'], TopicProgress>()
}

function hasIndexedDb() {
  return typeof indexedDB !== 'undefined'
}

export async function listExerciseAttempts() {
  if (!hasIndexedDb()) {
    return [...memoryState.exerciseAttempts].sort((left, right) => left.timestamp.localeCompare(right.timestamp))
  }

  return appDb.exerciseAttempts.orderBy('timestamp').toArray()
}

export async function listTopicProgress() {
  if (!hasIndexedDb()) {
    return [...memoryState.topicProgress.values()]
  }

  return appDb.topicProgress.toArray()
}

export async function saveAttemptAndProgress(attempt: ExerciseAttempt, progress: TopicProgress) {
  if (!hasIndexedDb()) {
    memoryState.exerciseAttempts.push(attempt)
    memoryState.topicProgress.set(progress.topic, progress)
    await logActivity('simplify-expressions')
    return
  }

  await appDb.transaction('rw', appDb.exerciseAttempts, appDb.topicProgress, async () => {
    await appDb.exerciseAttempts.add(attempt)
    await appDb.topicProgress.put(progress)
  })
  await logActivity('simplify-expressions')
}

export function resetExerciseRepositoryForTests() {
  memoryState.exerciseAttempts = []
  memoryState.topicProgress.clear()
}
