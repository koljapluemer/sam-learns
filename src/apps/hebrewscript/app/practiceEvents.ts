// Ported from linguanodon's hebrewscript app/practiceEvents.js, using this
// app's Dexie db instead of raw idb.js. No server sync (dropped
// mergeRemoteState-equivalent entirely) - import/export stays as a
// client-side JSON file round-trip, same as the source app.

import { appDb } from '../db/appDb'
import { HEBREW_LETTER_KEYS } from './model'
import type { Clip, DistractorCandidate, PracticeEvent, PracticeExportSnapshot, StoredClip } from './types'

export const toStoredClip = (clip: Pick<Clip, 'filename' | 'transcript'>): StoredClip => ({
  filename: clip.filename,
  transcript: clip.transcript
})

export const toPracticeEventAnalytics = (candidate: DistractorCandidate) => ({
  analyticsVersion: 1 as const,
  changedIndex: candidate.changedIndex,
  correctCharacter: candidate.correctCharacter,
  distractorCharacter: candidate.distractorCharacter,
  correctLetter: candidate.correctLetter,
  distractorLetter: candidate.distractorLetter
})

// Rebuilds a fresh plain object from primitive field access before handing to
// Dexie/IndexedDB. Necessary, not just defensive: Vue's ref()/reactive()
// wraps any object assigned to a ref's .value in a reactive Proxy, and the
// structured-clone algorithm IndexedDB uses cannot clone a Proxy. Reading
// primitives back out through the Proxy and reconstructing a literal strips
// the wrapper.
function clonePracticeEvent(event: PracticeEvent): PracticeEvent {
  return {
    eventType: event.eventType,
    clip: { filename: event.clip.filename, transcript: event.clip.transcript },
    timestamp: event.timestamp,
    selectionMode: event.selectionMode,
    distractor: event.distractor,
    duration_ms: event.duration_ms,
    selectedTranscript: event.selectedTranscript,
    isCorrect: event.isCorrect,
    analyticsVersion: event.analyticsVersion,
    changedIndex: event.changedIndex,
    correctCharacter: event.correctCharacter,
    distractorCharacter: event.distractorCharacter,
    correctLetter: event.correctLetter,
    distractorLetter: event.distractorLetter
  }
}

export const appendPracticeEvent = (event: PracticeEvent) => appDb.practiceEvents.add(clonePracticeEvent(event))

function compareEvents(left: PracticeEvent, right: PracticeEvent): number {
  const timestampComparison = left.timestamp.localeCompare(right.timestamp)
  if (timestampComparison !== 0) return timestampComparison
  return (left.id ?? 0) - (right.id ?? 0)
}

export async function listPracticeEvents(): Promise<PracticeEvent[]> {
  const rows = await appDb.practiceEvents.toArray()
  return [...rows].sort(compareEvents)
}

export async function readPracticeExportSnapshot(): Promise<PracticeExportSnapshot> {
  const events = await listPracticeEvents()
  return {
    exported_at: new Date().toISOString(),
    event_log: events.map((event) => ({ ...event, id: undefined }))
  }
}

const PRACTICE_EVENT_TYPES = new Set(['roundStarted', 'answer', 'audioListened', 'clipHidden'])
const SELECTION_MODES = new Set(['strategyA', 'strategyB'])
const LETTER_KEYS = new Set<string>(HEBREW_LETTER_KEYS)

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

function readOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'string') throw new Error(`Invalid ${field}.`)
  return value
}

function readOptionalNumber(value: unknown, field: string): number | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'number' || Number.isNaN(value)) throw new Error(`Invalid ${field}.`)
  return value
}

function readOptionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'boolean') throw new Error(`Invalid ${field}.`)
  return value
}

function readOptionalStringLiteral(value: unknown, allowedValues: Set<string>, field: string): string | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'string' || !allowedValues.has(value)) throw new Error(`Invalid ${field}.`)
  return value
}

function readOptionalNullableStringLiteral(value: unknown, allowedValues: Set<string>, field: string): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'string' || !allowedValues.has(value)) throw new Error(`Invalid ${field}.`)
  return value
}

function parsePracticeEvent(value: unknown): PracticeEvent {
  if (!isObject(value)) throw new Error('Invalid event_log entry.')

  const clip = value.clip
  if (!isObject(clip) || typeof clip.filename !== 'string' || typeof clip.transcript !== 'string') {
    throw new Error('Invalid event clip.')
  }

  if (typeof value.timestamp !== 'string') throw new Error('Invalid event timestamp.')
  if (typeof value.eventType !== 'string' || !PRACTICE_EVENT_TYPES.has(value.eventType)) {
    throw new Error('Invalid event type.')
  }

  return {
    eventType: value.eventType as PracticeEvent['eventType'],
    clip: { filename: clip.filename, transcript: clip.transcript },
    timestamp: value.timestamp,
    selectionMode: readOptionalStringLiteral(value.selectionMode, SELECTION_MODES, 'selectionMode') as PracticeEvent['selectionMode'],
    distractor: readOptionalString(value.distractor, 'distractor'),
    duration_ms: value.duration_ms === null ? null : readOptionalNumber(value.duration_ms, 'duration_ms'),
    selectedTranscript: readOptionalString(value.selectedTranscript, 'selectedTranscript'),
    isCorrect: readOptionalBoolean(value.isCorrect, 'isCorrect'),
    analyticsVersion:
      value.analyticsVersion === undefined
        ? undefined
        : value.analyticsVersion === 1
          ? (1 as const)
          : (() => {
              throw new Error('Invalid analyticsVersion.')
            })(),
    changedIndex: readOptionalNumber(value.changedIndex, 'changedIndex'),
    correctCharacter: readOptionalString(value.correctCharacter, 'correctCharacter'),
    distractorCharacter: readOptionalString(value.distractorCharacter, 'distractorCharacter'),
    correctLetter: readOptionalNullableStringLiteral(value.correctLetter, LETTER_KEYS, 'correctLetter'),
    distractorLetter: readOptionalNullableStringLiteral(value.distractorLetter, LETTER_KEYS, 'distractorLetter')
  }
}

export async function importPracticeExportSnapshot(snapshot: unknown): Promise<{ importedCount: number; skippedCount: number }> {
  if (!isObject(snapshot) || !Array.isArray(snapshot.event_log)) {
    throw new Error('Invalid tracked data file.')
  }

  const importedEvents = snapshot.event_log.map((event) => parsePracticeEvent(event))
  importedEvents.sort((left, right) => left.timestamp.localeCompare(right.timestamp))

  const existingRows = await appDb.practiceEvents.toArray()
  const seenTimestamps = new Set(existingRows.map((row) => row.timestamp))
  let importedCount = 0
  let skippedCount = 0

  for (const row of importedEvents) {
    if (seenTimestamps.has(row.timestamp)) {
      skippedCount += 1
      continue
    }
    await appDb.practiceEvents.add(row)
    seenTimestamps.add(row.timestamp)
    importedCount += 1
  }

  return { importedCount, skippedCount }
}
