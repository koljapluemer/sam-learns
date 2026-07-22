// Domain types ported from linguanodon's infinitesentences/static/.../js/types.d.ts.
// The window.Vue/lucide/Chart ambient globals are dropped - this repo has real
// npm imports for all three (vue, lucide-vue-next, chart.js).

export interface Language {
  code: string
  displayName: string
  symbols: string[]
  isNative: boolean
}

export interface LanguagePair {
  native: string
  target: string
  sentenceCount: number
}

export interface SentencePart {
  content: string
  translations: string[]
  usageExamples?: [string, string, string?][]
  transcription?: string
}

export interface SentenceData {
  sentence: string
  credits?: string[]
  translations: string[]
  parts: SentencePart[]
  transcription?: string
}

// Keyed by sentence `index` (string) - see cms/infinitesentences/import_from_linguanodon.py.
export type SentencesByIndex = Record<string, SentenceData>

export interface IndexCardRow {
  type: 'text' | 'divider'
  text?: string
  size?: 'auto' | 'normal' | 'small'
  subtext?: string
}

export interface TaskText {
  content: string
  ref?: string
}

export interface MemorizeTaskData {
  gloss: TaskText & { transcription?: string }
  translations: TaskText[]
}

export type RecallTaskData = MemorizeTaskData

export interface UnderstandTaskData {
  gloss: TaskText & { transcription?: string }
  translations: TaskText[]
  examples: { example: TaskText; translation: TaskText }[]
}

export interface ChallengeTaskData {
  gloss: TaskText & { transcription?: string }
  translations: TaskText[]
  credits?: string[]
}

export type PracticeTask =
  | { kind: 'memorize'; partKey: string; data: MemorizeTaskData }
  | { kind: 'recall'; partKey: string; data: RecallTaskData }
  | { kind: 'understand'; partKey: string; data: UnderstandTaskData }
  | { kind: 'challenge'; sentenceKey: string; data: ChallengeTaskData }
