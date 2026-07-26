import Dexie, { type EntityTable } from 'dexie'

export type TrialRow = {
  id: string
  date: string
  dividend: number
  divisor: number
  guess: number
  correct: number
  missedByPercent: number
}

class AppDb extends Dexie {
  trials!: EntityTable<TrialRow, 'id'>

  constructor() {
    super('currencyConversionPracticeDb')

    this.version(1).stores({
      trials: 'id, date'
    })
  }
}

export const appDb = new AppDb()
