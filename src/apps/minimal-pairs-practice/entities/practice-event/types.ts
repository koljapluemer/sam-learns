// Kept structurally identical to (but independent of) entities/tone-clip's
// Clip/DistractorCandidate shapes, rather than importing them - entities may
// only import from db, never from another entity (see CLAUDE.md).

export type StoredClip = { filename: string; transcript: string; nativeScript?: string }

export type PracticeRoundSelectionMode = 'strategyA' | 'strategyB'

export interface PracticeEvent {
  eventType: 'roundStarted' | 'answer' | 'audioListened' | 'clipHidden'
  clip: StoredClip
  timestamp: string
  // Language pack code (e.g. 'vie', 'cmn') this event belongs to. Missing on
  // events logged before multi-language support - treated as 'vie' by
  // listPracticeEvents, since that's the only language that existed then.
  language?: string
  selectionMode?: PracticeRoundSelectionMode
  distractor?: string
  duration_ms?: number | null
  selectedTranscript?: string
  isCorrect?: boolean
  analyticsVersion?: 1
  changedIndex?: number
  correctCharacter?: string
  distractorCharacter?: string
  correctTone?: string | null
  distractorTone?: string | null
  id?: string
}

export interface PracticeExportSnapshot {
  exported_at: string
  event_log: PracticeEvent[]
}
