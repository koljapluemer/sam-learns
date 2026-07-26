import { activityDb } from './activityDb'
import { toLocalDayKey } from './dayBoundary'

// Fire-and-forget: this is a separate physical Dexie database from any app's
// own db, so it can never join an app's own transaction anyway. Losing an
// occasional event is an acceptable failure mode for a local usage signal.
//
// Call this once per "trial" as defined by the app (see each app's
// PageStats.vue / agents.md for its trial definition) - it drives the
// trials-per-app-per-day chart on the global stats section.
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

// Accumulates active-time milliseconds into the current local day's bucket
// for an app. This is the shared sink for time-tracking: apps using the
// generic useActiveTime tracker call it automatically, and apps with bespoke
// time tracking (e.g. video/audio watch time) should call it directly
// whenever they know elapsed active ms, so the global stats time chart has
// one consistent source regardless of how each app measures time.
export async function logActiveTimeMs(appSlug: string, ms: number): Promise<void> {
  if (!Number.isFinite(ms) || ms <= 0) return

  try {
    const dayKey = toLocalDayKey(new Date().toISOString())
    const id = `${appSlug}_${dayKey}`
    const existing = await activityDb.activityTimeEntries.get(id)
    await activityDb.activityTimeEntries.put({ id, appSlug, dayKey, ms: (existing?.ms ?? 0) + ms })
  } catch {
    // non-critical, swallow
  }
}
