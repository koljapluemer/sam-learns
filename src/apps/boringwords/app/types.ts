// Domain types ported from linguanodon's boringwords/static/.../js/types.d.ts.
// FsrsCard/SerializedCard are dropped - this repo uses ts-fsrs's own `Card`
// type directly (see src/apps/world-map/db/appDb.ts), stored in Dexie with
// real Date fields instead of the original's localStorage JSON-string dates.

export type BoringWordsLanguage = 'vie' | 'arz'

export interface Word {
  id: number
  language: BoringWordsLanguage
  front: string
  back: string
  credit: string
}

export interface Background {
  language: BoringWordsLanguage
  filename: string
  credit: string
}
