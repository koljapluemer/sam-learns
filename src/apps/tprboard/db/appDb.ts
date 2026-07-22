// Dexie port of linguanodon's tprboard app/learning.js raw-IndexedDB store
// (database 'tpr-board-learning', 4 stores) - same shapes, just Dexie
// instead of hand-written IDBDatabase/IDBTransaction plumbing. No
// mergeRemoteState/queueEvent/queueState - there's no server, Dexie is the
// only source of truth (see docs/linguanodon-import.md).
import Dexie, { type EntityTable } from 'dexie'
import type { LearningEvent, LearningItem, LanguageProgress, SentenceLearningItem } from '../app/types'

class TprboardDb extends Dexie {
  learningItems!: EntityTable<LearningItem, 'key'>
  sentenceLearningItems!: EntityTable<SentenceLearningItem, 'key'>
  languageProgress!: EntityTable<LanguageProgress, 'languageCode'>
  learningEvents!: EntityTable<LearningEvent, 'id'>

  constructor() {
    super('tprboardDb')

    this.version(1).stores({
      learningItems: 'key, languageCode',
      sentenceLearningItems: 'key, languageCode',
      languageProgress: 'languageCode',
      learningEvents: '++id'
    })
  }
}

export const appDb = new TprboardDb()

export function buildLearningItemKey(languageCode: string, objectName: string): string {
  return `${languageCode}:${objectName}`
}

export function buildSentenceLearningItemKey(languageCode: string, taskKey: string, textIndex: number): string {
  return `${languageCode}:${taskKey}:${textIndex}`
}
