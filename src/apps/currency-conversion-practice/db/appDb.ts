import { db } from '@/shared/db/db'
import type { EntityTable } from 'dexie'

export type TrialRow = {
  id: string
  date: string
  dividend: number
  divisor: number
  guess: number
  correct: number
  missedByPercent: number
}

export const appDb = {
  trials: db.table('currencyConversionPractice_trials') as EntityTable<TrialRow, 'id'>
}
