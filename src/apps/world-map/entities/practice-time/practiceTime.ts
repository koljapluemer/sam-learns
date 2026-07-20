import { appDb } from '@/apps/world-map/db/appDb'

const TICK_MS = 1000
const FLUSH_AFTER_SECONDS = 5

let intervalId: ReturnType<typeof setInterval> | null = null
let pendingSeconds = 0

function isTabActive(): boolean {
  return document.visibilityState === 'visible' && document.hasFocus()
}

async function flushPending(): Promise<void> {
  if (pendingSeconds <= 0) return
  const ms = pendingSeconds * 1000
  pendingSeconds = 0

  const existing = await appDb.practiceTime.get('total')
  await appDb.practiceTime.put({ key: 'total', totalMs: (existing?.totalMs ?? 0) + ms })
}

function handleVisibilityChange(): void {
  if (document.visibilityState === 'hidden') void flushPending()
}

function tick(): void {
  if (!isTabActive()) return
  pendingSeconds += 1
  if (pendingSeconds >= FLUSH_AFTER_SECONDS) void flushPending()
}

// Basic heuristic: only counts time while this tab is visible and focused,
// sampled once per second and flushed to Dexie in small batches.
export function startPracticeTimeTracking(): void {
  if (intervalId) return
  intervalId = setInterval(tick, TICK_MS)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('beforeunload', handleVisibilityChange)
}

export function stopPracticeTimeTracking(): void {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('beforeunload', handleVisibilityChange)
  void flushPending()
}

export async function getTotalPracticeMs(): Promise<number> {
  const row = await appDb.practiceTime.get('total')
  return row?.totalMs ?? 0
}
