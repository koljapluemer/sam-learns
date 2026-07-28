import { appDb, type WordRow } from '../../db/appDb'

export async function addWord(text: string, translation: string, note = ''): Promise<string> {
  const id = crypto.randomUUID()
  const row: WordRow = {
    id,
    text,
    translation,
    note,
    examplesOptOut: false,
    createdAt: new Date().toISOString()
  }
  await appDb.words.add(row)
  return id
}

export async function updateWord(id: string, text: string, translation: string): Promise<void> {
  await appDb.words.update(id, { text, translation })
}

export async function updateWordNote(id: string, note: string): Promise<void> {
  await appDb.words.update(id, { note })
}

export async function setExamplesOptOut(id: string): Promise<void> {
  await appDb.words.update(id, { examplesOptOut: true })
}

export async function deleteWord(id: string): Promise<void> {
  const sentencesWithWord = await appDb.sentences.where('wordIds').equals(id).toArray()
  await Promise.all(
    sentencesWithWord.map((sentence) =>
      appDb.sentences.update(sentence.id, { wordIds: sentence.wordIds.filter((wordId) => wordId !== id) })
    )
  )
  await appDb.words.delete(id)
}

export async function getWord(id: string): Promise<WordRow | undefined> {
  return appDb.words.get(id)
}

// Words are unique by target-language text: this is how the UI decides
// whether typing/pasting a word should update an existing entry instead of
// creating a duplicate.
export async function findWordByText(text: string): Promise<WordRow | undefined> {
  return appDb.words.where('text').equals(text).first()
}

export async function listWords(): Promise<WordRow[]> {
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

export async function countExampleSentences(wordId: string): Promise<number> {
  return appDb.sentences.where('wordIds').equals(wordId).count()
}

export async function getWordsEligibleForExamples(): Promise<WordRow[]> {
  const all = await appDb.words.toArray()
  return all.filter((word) => !word.examplesOptOut)
}

export async function findSimilarWords(query: string, limit = 5): Promise<WordRow[]> {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return []

  const all = await appDb.words.toArray()
  return all.filter((row) => row.text.toLowerCase().includes(trimmed)).slice(0, limit)
}
