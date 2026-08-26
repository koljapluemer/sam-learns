// Reads the static top-vocab catalog from public/data/top-vocab/: languages.json
// lists available languages, <lang>/words.json holds each vocab word's
// translations and example sentences.
import { loadJson } from '../../dumb/loadJson'

export type VocabLanguage = { code: string; name: string }
export type VocabExample = { target: string; translation: string }
export type VocabEntry = { word: string; translations: string[]; examples: VocabExample[] }

// Raw example objects are keyed by the target language's example, e.g.
// { vi: "...", en: "..." } - the target-text key isn't the folder's language
// code (folder "vie" vs. example key "vi"), so it's read positionally: "en"
// is always the translation, the other key is always the target text.
type RawExample = Record<string, string>
type RawVocabEntry = { translations: string[]; examples: RawExample[] }

function normalizeExample(raw: RawExample): VocabExample {
  const translation = raw.en ?? ''
  const targetKey = Object.keys(raw).find((key) => key !== 'en')
  return { target: targetKey ? raw[targetKey] : '', translation }
}

let languagesPromise: Promise<VocabLanguage[]> | null = null

export function getLanguages(): Promise<VocabLanguage[]> {
  languagesPromise ??= loadJson<Record<string, string>>('/data/top-vocab/languages.json').then((record) =>
    Object.entries(record).map(([code, name]) => ({ code, name }))
  )
  return languagesPromise
}

const wordsCache = new Map<string, Promise<Map<string, VocabEntry>>>()

export function getWords(languageCode: string): Promise<Map<string, VocabEntry>> {
  let promise = wordsCache.get(languageCode)
  if (!promise) {
    promise = loadJson<Record<string, RawVocabEntry>>(`/data/top-vocab/${languageCode}/words.json`).then(
      (record) =>
        new Map(
          Object.entries(record).map(([word, entry]) => [
            word,
            { word, translations: entry.translations, examples: entry.examples.map(normalizeExample) }
          ])
        )
    )
    wordsCache.set(languageCode, promise)
  }
  return promise
}

export const MIN_VOCAB_EXAMPLES = 4

export function isVocabEligible(entry: VocabEntry): boolean {
  return entry.examples.length >= MIN_VOCAB_EXAMPLES
}
