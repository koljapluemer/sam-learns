import Dexie, { type EntityTable } from 'dexie'
import type { Card } from 'ts-fsrs'

export type ExerciseType = 'find-in-neighborhood' | 'find-on-world-map' | 'identify-country'

export type CountryProgressRow = Card & { country: string }
export type ExerciseProgressRow = Card & { exerciseKey: string; exerciseType: ExerciseType; country: string; panIndex?: number }

export type LearningEventRow = {
  id: string
  timestamp: string
  exerciseType: ExerciseType
  country: string
  panIndex?: number
  numberOfClicksNeeded: number
  msToFirstClick: number
}

class WorldMapDb extends Dexie {
  countryProgress!: EntityTable<CountryProgressRow, 'country'>
  exerciseProgress!: EntityTable<ExerciseProgressRow, 'exerciseKey'>
  learningEvents!: EntityTable<LearningEventRow, 'id'>

  constructor() {
    super('worldMapDb')

    this.version(1).stores({
      countryProgress: 'country',
      exerciseProgress: 'exerciseKey, country',
      learningEvents: 'id, timestamp, country'
    })
  }
}

export const appDb = new WorldMapDb()

export function makeExerciseKey(type: ExerciseType, country: string, panIndex?: number): string {
  switch (type) {
    case 'find-in-neighborhood':
      return `${country}:${panIndex}`
    case 'find-on-world-map':
      return `${country}:world-map`
    case 'identify-country':
      return `${country}:identify-country`
  }
}
