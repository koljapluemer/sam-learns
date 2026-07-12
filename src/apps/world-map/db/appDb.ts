import Dexie, { type EntityTable } from 'dexie'
import type { Card } from 'ts-fsrs'

export type CountryProgressRow = Card & { country: string }
export type ExerciseProgressRow = Card & { exerciseKey: string; country: string; panIndex: number }

export type LearningEventRow = {
  id: string
  timestamp: string
  country: string
  panIndex: number
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

export function makeExerciseKey(country: string, panIndex: number): string {
  return `${country}:${panIndex}`
}
