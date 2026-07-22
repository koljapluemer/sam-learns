// Watch-time tracking, ported from linguanodon's comprehensible_input
// app/idb.js + app/watchTracker.js. Ties YouTube player state to this app's
// Dexie db: while the player is "playing", accrues elapsed seconds every
// tick and extends/closes a set of watched time ranges. Deliberately stays
// tick-based (every 5s) rather than listening to every player event, so it
// stays reasonably robust to skipping/pausing without polling any faster.
//
// Unlike the original, there's no server sync (queueEvent/queueState) - the
// Dexie record is the only copy. `logActivity` fires once per video start
// instead of the original's per-tick queueEvent, matching how every other
// app in this repo logs one event per meaningful action rather than every
// few seconds.

import { appDb } from '../db/appDb'
import { logActivity } from '@/shared/activity/useLearningEvent'
import type { WatchMeta, WatchSegment, YTPlayer } from './types'

const TICK_MS = 5000
const TICK_SECONDS = TICK_MS / 1000
// A gap this small between ticks is normal playback, not a seek/skip.
const CONTINUATION_TOLERANCE_SECONDS = TICK_SECONDS * 1.5
// Segments within this many seconds of each other are treated as one
// continuous watch, since the tracker only samples every TICK_MS - a gap
// smaller than ~1.5x the tick is just normal playback, not a skip.
const SEGMENT_MERGE_TOLERANCE_SECONDS = 8

export function mergeSegment(segments: WatchSegment[], incoming: WatchSegment): WatchSegment[] {
  const untouched: WatchSegment[] = []
  let merged = { ...incoming }

  for (const segment of segments) {
    const overlaps =
      incoming.start <= segment.end + SEGMENT_MERGE_TOLERANCE_SECONDS &&
      incoming.end >= segment.start - SEGMENT_MERGE_TOLERANCE_SECONDS
    if (overlaps) {
      merged = { start: Math.min(merged.start, segment.start), end: Math.max(merged.end, segment.end) }
    } else {
      untouched.push(segment)
    }
  }

  return [...untouched, merged].sort((a, b) => a.start - b.start)
}

async function recordWatchProgress(
  videoId: number,
  meta: WatchMeta,
  progress: { secondsDelta?: number; segment?: WatchSegment }
): Promise<void> {
  const existing = await appDb.watchTime.get(videoId)
  const record = {
    videoId,
    languageId: meta.languageId,
    languageName: meta.languageName,
    videoTitle: meta.videoTitle,
    seconds: (existing?.seconds ?? 0) + (progress.secondsDelta ?? 0),
    segments: progress.segment ? mergeSegment(existing?.segments ?? [], progress.segment) : (existing?.segments ?? [])
  }
  await appDb.watchTime.put(record)
}

export function createWatchTracker(meta: WatchMeta) {
  let isPlaying = false
  let player: YTPlayer | null = null
  let openSegment: WatchSegment | null = null
  let sessionSegments: WatchSegment[] = []
  let loggedThisVideo = false

  function closeOpenSegment(): void {
    if (!openSegment) return
    sessionSegments = mergeSegment(sessionSegments, openSegment)
    openSegment = null
  }

  function tick(): void {
    if (!isPlaying || !player) return

    const time = player.getCurrentTime()
    if (openSegment && Math.abs(time - openSegment.end) <= CONTINUATION_TOLERANCE_SECONDS) {
      openSegment.end = time
    } else {
      closeOpenSegment()
      openSegment = { start: time, end: time }
    }

    void recordWatchProgress(meta.videoId, meta, { secondsDelta: TICK_SECONDS, segment: openSegment })
  }

  const intervalId = window.setInterval(tick, TICK_MS)

  return {
    setPlaying(playing: boolean) {
      if (playing && !loggedThisVideo) {
        loggedThisVideo = true
        void logActivity('comprehensible-input')
      }
      if (!playing) closeOpenSegment()
      isPlaying = playing
    },
    setPlayer(nextPlayer: YTPlayer) {
      player = nextPlayer
    },
    getSessionSegments: () => (openSegment ? mergeSegment(sessionSegments, openSegment) : sessionSegments),
    destroy() {
      closeOpenSegment()
      window.clearInterval(intervalId)
    }
  }
}

export async function addSurveyResponse(response: {
  videoId: number
  languageId: number
  languageName: string
  videoTitle: string
  timestamp: number
  comprehension: number
  listening: number
  rewatch: 'no' | 'yes' | 'certainly'
  segments: WatchSegment[]
}): Promise<void> {
  await appDb.sessions.add(response)
}

export async function getAllWatchRecords() {
  return appDb.watchTime.toArray()
}
