import { activityDb } from './activityDb'

// Fire-and-forget: this is a separate physical Dexie database from any app's
// own db, so it can never join an app's own transaction anyway. Losing an
// occasional event is an acceptable failure mode for a local usage signal.
export async function logActivity(appSlug: string): Promise<void> {
  try {
    await activityDb.activityEvents.add({
      id: crypto.randomUUID(),
      appSlug,
      timestamp: new Date().toISOString()
    })
  } catch {
    // non-critical, swallow
  }
}
