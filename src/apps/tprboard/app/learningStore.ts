// Port of linguanodon's tprboard app/learning.js - the ebisu-model read/write
// half. mergeRemoteState/queueEvent/queueState are dropped (no server sync in
// this repo); trials are logged via the shared cross-app activity log instead.
import { defaultModel, updateRecall } from './ebisu'
import { appDb, buildLearningItemKey, buildSentenceLearningItemKey } from '../db/appDb'
import { logActivity } from '@/shared/activity/useLearningEvent'
import type { EbisuModel, LanguageProgress, LearningItem, RoundOutcome, RoundSelectionMode, SentenceLearningItem, TaskCandidate } from './types'

const HOURS_PER_MILLISECOND = 1 / (1000 * 60 * 60)
const MIN_ELAPSED_HOURS = 1 / 3600

type LearningRecord = {
  correctCount: number
  ebisuModel: EbisuModel
  incorrectCount: number
  key: string
  languageCode: string
  lastReviewedAt: number
  seenCount: number
}

export type LearningSnapshot = {
  itemsByObjectName: Map<string, LearningItem>
  progress: LanguageProgress | null
  sentenceItemsByKey: Map<string, SentenceLearningItem>
}

type RecordCompletedRoundParams = {
  activeTask: TaskCandidate
  attemptCount: number
  boardObjectNames: string[]
  completedAt?: number
  difficulty: number
  hadWrongAttempt: boolean
  languageCode: string
  selectionMode: RoundSelectionMode
}

function createLearningRecord(key: string, languageCode: string, outcome: RoundOutcome, reviewedAt: number): LearningRecord {
  return {
    correctCount: outcome === 'correct' ? 1 : 0,
    ebisuModel: defaultModel(24),
    incorrectCount: outcome === 'wrong' ? 1 : 0,
    key,
    languageCode,
    lastReviewedAt: reviewedAt,
    seenCount: 1
  }
}

function updateLearningRecord<T extends LearningRecord>(item: T, outcome: RoundOutcome, reviewedAt: number): T {
  const elapsedHours = Math.max((reviewedAt - item.lastReviewedAt) * HOURS_PER_MILLISECOND, MIN_ELAPSED_HOURS)
  const success = outcome === 'correct' ? 1 : 0

  return {
    ...item,
    correctCount: item.correctCount + success,
    ebisuModel: updateRecall(item.ebisuModel, success, 1, elapsedHours),
    incorrectCount: item.incorrectCount + (success === 0 ? 1 : 0),
    lastReviewedAt: reviewedAt,
    seenCount: item.seenCount + 1
  }
}

export async function loadLearningSnapshot(languageCode: string): Promise<LearningSnapshot> {
  const [items, progress, sentenceItems] = await Promise.all([
    appDb.learningItems.where('languageCode').equals(languageCode).toArray(),
    appDb.languageProgress.get(languageCode),
    appDb.sentenceLearningItems.where('languageCode').equals(languageCode).toArray()
  ])

  return {
    itemsByObjectName: new Map(items.map((item) => [item.objectName, item])),
    progress: progress ?? null,
    sentenceItemsByKey: new Map(sentenceItems.map((item) => [item.key, item]))
  }
}

export async function recordCompletedRound({
  activeTask,
  attemptCount,
  boardObjectNames,
  completedAt = Date.now(),
  difficulty,
  hadWrongAttempt,
  languageCode,
  selectionMode
}: RecordCompletedRoundParams): Promise<void> {
  const outcome: RoundOutcome = hadWrongAttempt ? 'wrong' : 'correct'
  const touchedObjectNames = [activeTask.sourceName, activeTask.targetName]

  const existingItems = await appDb.learningItems
    .where('key')
    .anyOf(touchedObjectNames.map((objectName) => buildLearningItemKey(languageCode, objectName)))
    .toArray()
  const existingItemsByObjectName = new Map(existingItems.map((item) => [item.objectName, item]))

  const existingSentenceItem = await appDb.sentenceLearningItems.get(
    buildSentenceLearningItemKey(languageCode, activeTask.key, activeTask.textIndex)
  )

  const nextItems: LearningItem[] = touchedObjectNames.map((objectName) => {
    const existingItem = existingItemsByObjectName.get(objectName)

    if (!existingItem) {
      return {
        ...createLearningRecord(buildLearningItemKey(languageCode, objectName), languageCode, outcome, completedAt),
        objectName
      }
    }

    return updateLearningRecord(existingItem, outcome, completedAt)
  })

  const nextSentenceItem: SentenceLearningItem = existingSentenceItem
    ? updateLearningRecord(existingSentenceItem, outcome, completedAt)
    : {
        ...createLearningRecord(
          buildSentenceLearningItemKey(languageCode, activeTask.key, activeTask.textIndex),
          languageCode,
          outcome,
          completedAt
        ),
        taskKey: activeTask.key,
        textIndex: activeTask.textIndex
      }

  const progress: LanguageProgress = {
    languageCode,
    lastBoardDifficulty: difficulty,
    lastOutcome: outcome
  }

  await appDb.transaction(
    'readwrite',
    [appDb.learningEvents, appDb.learningItems, appDb.languageProgress, appDb.sentenceLearningItems],
    async () => {
      await appDb.learningEvents.add({
        attemptCount,
        boardObjectNames: [...boardObjectNames],
        completedAt,
        difficulty,
        hadWrongAttempt,
        languageCode,
        selectionMode,
        sourceName: activeTask.sourceName,
        targetName: activeTask.targetName,
        taskKey: activeTask.key,
        taskTextIndex: activeTask.textIndex
      })
      await appDb.learningItems.bulkPut(nextItems)
      await appDb.languageProgress.put(progress)
      await appDb.sentenceLearningItems.put(nextSentenceItem)
    }
  )

  void logActivity('tprboard')
}
