import { appDb, type TrialRow } from '../../db/appDb'

export const RECENT_TRIAL_COUNT = 20

export async function recordTrial(input: Omit<TrialRow, 'id'>): Promise<void> {
  await appDb.trials.add({ id: crypto.randomUUID(), ...input })
}

export async function getAllTrials(): Promise<TrialRow[]> {
  return appDb.trials.orderBy('date').toArray()
}
