// Dexie port of linguanodon's tprboard app/learning.js raw-IndexedDB store
// (database 'tpr-board-learning', 4 stores) - same shapes, just Dexie
// instead of hand-written IDBDatabase/IDBTransaction plumbing. No
// mergeRemoteState/queueEvent/queueState - there's no server, Dexie is the
// only source of truth (see docs/linguanodon-import.md).
import { db } from '@/shared/db/db'
import type { EntityTable } from 'dexie'
import type { LearningEvent, LearningItem, LanguageProgress, SentenceLearningItem } from '../app/types'

export const appDb = {
  learningItems: db.table('tprboard_learningItems') as EntityTable<LearningItem, 'key'>,
  sentenceLearningItems: db.table('tprboard_sentenceLearningItems') as EntityTable<SentenceLearningItem, 'key'>,
  languageProgress: db.table('tprboard_languageProgress') as EntityTable<LanguageProgress, 'languageCode'>,
  learningEvents: db.table('tprboard_learningEvents') as EntityTable<LearningEvent, 'id'>
}

export function buildLearningItemKey(languageCode: string, objectName: string): string {
  return `${languageCode}:${objectName}`
}

export function buildSentenceLearningItemKey(languageCode: string, taskKey: string, textIndex: number): string {
  return `${languageCode}:${taskKey}:${textIndex}`
}
