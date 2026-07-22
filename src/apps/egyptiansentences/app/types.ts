// Domain types ported from linguanodon's egyptiansentences/static/.../js/types.d.ts
// (dropping the ambient window.Vue/window.lucide typings, which only
// existed there because that build had no real Vue/lucide-vue-next import).

export interface ClozeWord {
  word: string
  distractors: string[]
}

export interface Sentence {
  id: number
  arz: string
  transliteration: string
  translations: string[]
  cloze_words: ClozeWord[]
}

export interface Highscore {
  score: number
  date: string
}

export interface IndexCardRow {
  type: 'text' | 'divider'
  text?: string
  size?: 'small' | 'auto'
  rtl?: boolean
}

export type GameMode = 'undetermined' | 'go' | 'game-ended'
