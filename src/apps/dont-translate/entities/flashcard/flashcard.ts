// Reads the static catalog from public/data/dont-translate/: languages.json
// lists available languages, <lang>.jsonl holds one flashcard per line
// (an image filename plus the expressions naming it in that language).
import { loadJson } from '../../dumb/loadJson'

const DATA_URL = '/data/dont-translate'

export type Language = { code: string; name: string }
export type Flashcard = { id: string; image: string; expressions: string[] }

type RawFlashcard = { image: string; expressions: string[] }

let languagesPromise: Promise<Language[]> | null = null

export function getLanguages(): Promise<Language[]> {
  languagesPromise ??= loadJson<Record<string, string>>(`${DATA_URL}/languages.json`).then((record) =>
    Object.entries(record).map(([code, name]) => ({ code, name }))
  )
  return languagesPromise
}

function parseFlashcard(line: string): Flashcard {
  const raw = JSON.parse(line) as RawFlashcard
  return { id: raw.image, image: `${DATA_URL}/images/${raw.image}`, expressions: raw.expressions }
}

const flashcardsCache = new Map<string, Promise<Flashcard[]>>()

export function getFlashcards(languageCode: string): Promise<Flashcard[]> {
  let promise = flashcardsCache.get(languageCode)
  if (!promise) {
    promise = fetch(`${DATA_URL}/${languageCode}.jsonl`)
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load flashcards for ${languageCode} (${response.status})`)
        return response.text()
      })
      .then((text) => text.split('\n').filter((line) => line.trim()).map(parseFlashcard))
    flashcardsCache.set(languageCode, promise)
  }
  return promise
}
