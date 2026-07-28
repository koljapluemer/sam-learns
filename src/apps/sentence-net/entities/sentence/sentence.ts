import { appDb, type SentenceRow } from '../../db/appDb'

// Form-bound arrays come from reactive Vue refs; IndexedDB's structured clone
// can't serialize the reactive Proxy, so strip it down to plain data first.
function toPlainIds(ids: string[]): string[] {
  return JSON.parse(JSON.stringify(ids)) as string[]
}

export async function addSentence(text: string, translation: string, note = ''): Promise<string> {
  const id = crypto.randomUUID()
  const row: SentenceRow = {
    id,
    text,
    translation,
    note,
    wordIds: [],
    vocabDone: false,
    createdAt: new Date().toISOString()
  }
  await appDb.sentences.add(row)
  return id
}

export async function updateSentenceText(id: string, text: string, translation: string): Promise<void> {
  await appDb.sentences.update(id, { text, translation })
}

export async function updateSentenceNote(id: string, note: string): Promise<void> {
  await appDb.sentences.update(id, { note })
}

export async function setSentenceWords(id: string, wordIds: string[]): Promise<void> {
  await appDb.sentences.update(id, { wordIds: toPlainIds(wordIds) })
}

export async function markVocabDone(id: string): Promise<void> {
  await appDb.sentences.update(id, { vocabDone: true })
}

export async function addWordToSentence(sentenceId: string, wordId: string): Promise<void> {
  const row = await appDb.sentences.get(sentenceId)
  if (!row || row.wordIds.includes(wordId)) return
  await appDb.sentences.update(sentenceId, { wordIds: [...row.wordIds, wordId] })
}

export async function removeWordFromSentence(sentenceId: string, wordId: string): Promise<void> {
  const row = await appDb.sentences.get(sentenceId)
  if (!row) return
  await appDb.sentences.update(sentenceId, { wordIds: row.wordIds.filter((id) => id !== wordId) })
}

export async function deleteSentence(id: string): Promise<void> {
  await appDb.sentences.delete(id)
}

export async function getSentence(id: string): Promise<SentenceRow | undefined> {
  return appDb.sentences.get(id)
}

export async function listSentences(): Promise<SentenceRow[]> {
  return appDb.sentences.toArray()
}

export async function getSentencesEligibleForVocab(): Promise<SentenceRow[]> {
  const all = await appDb.sentences.toArray()
  return all.filter((row) => !row.vocabDone)
}

export async function getSentencesContainingWord(wordId: string): Promise<SentenceRow[]> {
  return appDb.sentences.where('wordIds').equals(wordId).toArray()
}

export async function findSimilarSentences(query: string, limit = 5): Promise<SentenceRow[]> {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return []

  const all = await appDb.sentences.toArray()
  return all.filter((row) => row.text.toLowerCase().includes(trimmed)).slice(0, limit)
}
