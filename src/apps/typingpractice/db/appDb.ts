import Dexie, { type EntityTable } from 'dexie'

// One row per completed line, used to compute WPM/accuracy per day on the
// stats page. `ms` is how long this specific line took (from the previous
// line's completion, or session start) - active/typing time only, per the
// session pause/resume logic in useTypingSession.
export type LineAttemptRow = {
  id: string
  timestamp: string
  words: number
  chars: number
  mistakes: number
  ms: number
}

class AppDb extends Dexie {
  lineAttempts!: EntityTable<LineAttemptRow, 'id'>

  constructor() {
    super('typingpracticeDb')

    this.version(1).stores({
      lineAttempts: 'id, timestamp'
    })
  }
}

export const appDb = new AppDb()
