import Dexie, { type EntityTable } from 'dexie'
import type { Card } from 'ts-fsrs'

// key = `${youtubeId}::${term}` - shares FSRS state across every segment
// where a term recurs within one video, isolated from other videos.
export type VocabCardRow = Card & { key: string }

class TheLittlePrinceDb extends Dexie {
  vocabCards!: EntityTable<VocabCardRow, 'key'>

  constructor() {
    super('theLittlePrinceDb')

    this.version(1).stores({
      vocabCards: 'key'
    })
  }
}

export const appDb = new TheLittlePrinceDb()
