import { db } from '@/shared/db/db'
import type { EntityTable } from 'dexie'
import type { Card } from 'ts-fsrs'

export type ExerciseType =
  | 'find-in-neighborhood'
  | 'find-on-world-map'
  | 'identify-country'
  | 'distractor-choice'
  | 'group-sequence'

export type CountryProgressRow = Card & { country: string }
export type ExerciseProgressRow = Card & {
  exerciseKey: string
  exerciseType: ExerciseType
  country: string
  panIndex?: number
  groupId?: string
}

export type LearningEventRow = {
  id: string
  timestamp: string
  exerciseType: ExerciseType
  country: string
  panIndex?: number
  numberOfClicksNeeded: number
  msToFirstClick: number
}

export type PracticeTimeRow = { key: 'total'; totalMs: number }

export const appDb = {
  countryProgress: db.table('worldMap_countryProgress') as EntityTable<CountryProgressRow, 'country'>,
  exerciseProgress: db.table('worldMap_exerciseProgress') as EntityTable<ExerciseProgressRow, 'exerciseKey'>,
  learningEvents: db.table('worldMap_learningEvents') as EntityTable<LearningEventRow, 'id'>,
  practiceTime: db.table('worldMap_practiceTime') as EntityTable<PracticeTimeRow, 'key'>
}

export function makeExerciseKey(type: ExerciseType, country: string, panIndex?: number, groupId?: string): string {
  switch (type) {
    case 'find-in-neighborhood':
      return `${country}:${panIndex}`
    case 'find-on-world-map':
      return `${country}:world-map`
    case 'identify-country':
      return `${country}:identify-country`
    case 'distractor-choice':
      return `${country}:distractor-choice`
    case 'group-sequence':
      return `${country}:group-sequence:${groupId}`
  }
}
