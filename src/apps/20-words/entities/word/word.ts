import { appDb, type ExampleRow, type NoteRow, type WordRow } from '../../db/appDb'
import { toDayKey } from '../../dumb/dayBoundary'

export type NewWordInput = {
  word: string
  meaning: string
  language: string
  examples: ExampleRow[]
  notes: NoteRow[]
}

export async function addWord(input: NewWordInput): Promise<void> {
  const now = new Date().toISOString()
  const row: WordRow = {
    id: crypto.randomUUID(),
    language: input.language,
    word: input.word,
    meaning: input.meaning,
    examples: input.examples,
    notes: input.notes,
    createdAt: now,
    dayKey: toDayKey(now),
    memorizeRow: null,
    memorizeSeq: null,
    memorized: false,
    memorizedAt: null
  }
  await appDb.words.add(row)
}

export async function countWordsAddedToday(now = new Date()): Promise<number> {
  const dayKey = toDayKey(now.toISOString())
  return appDb.words.where('dayKey').equals(dayKey).count()
}

export async function listUnmemorizedWords(): Promise<WordRow[]> {
  const all = await appDb.words.toArray()
  return all.filter((row) => !row.memorized)
}

export async function countUnmemorizedWords(): Promise<number> {
  const unmemorized = await listUnmemorizedWords()
  return unmemorized.length
}

export async function assignToRow(id: string, memorizeRow: number, memorizeSeq: number): Promise<void> {
  await appDb.words.update(id, { memorizeRow, memorizeSeq })
}

export async function graduateWordRow(id: string): Promise<void> {
  const now = new Date().toISOString()
  await appDb.words.update(id, { memorized: true, memorizedAt: now, memorizeRow: null, memorizeSeq: null })
}

export async function allWords(): Promise<WordRow[]> {
  return appDb.words.toArray()
}

export async function getWordsByIds(ids: string[]): Promise<Map<string, WordRow>> {
  const rows = await appDb.words.bulkGet(ids)
  const map = new Map<string, WordRow>()
  for (const row of rows) {
    if (row) map.set(row.id, row)
  }
  return map
}
