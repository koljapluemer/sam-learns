// Domain types for a "tone clip" - an audio clip plus its tone-marked
// spelling (Vietnamese: the transcript itself; Mandarin: derived pinyin,
// see languages/mandarin.ts) and the candidate tone-swapped distractors
// generated from it.

export interface Clip {
  filename: string
  transcript: string
  audioSrc: string
  // Hanzi for Mandarin clips (transcript is pinyin) - unset for languages
  // whose transcript already is the native script, e.g. Vietnamese.
  nativeScript?: string
}

export interface DistractorCandidate {
  label: string
  // The transcript word whose tone was swapped to build this distractor.
  word: string
  changedIndex: number
  correctCharacter: string
  distractorCharacter: string
  correctTone: string
  distractorTone: string
}

export interface PracticeCatalogEntry {
  clip: Clip
  candidates: DistractorCandidate[]
}

export interface PracticePairTarget {
  correctKey: string
  distractorKey: string
}

export interface AnswerOption {
  label: string
  isCorrect: boolean
}
