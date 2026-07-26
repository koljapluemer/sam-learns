// Read helpers over the shared cross-app activityDb, for per-app PageStats.vue
// numeric stats (e.g. "Time spent", "Trials") and the global stats charts.
import { activityDb } from './activityDb'

export async function getTotalActiveTimeMs(appSlug: string): Promise<number> {
  const rows = await activityDb.activityTimeEntries.where('appSlug').equals(appSlug).toArray()
  return rows.reduce((sum, row) => sum + row.ms, 0)
}

export async function getTotalTrialCount(appSlug: string): Promise<number> {
  return activityDb.activityEvents.where('appSlug').equals(appSlug).count()
}
