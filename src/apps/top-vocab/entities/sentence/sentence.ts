// Reads the static sentence pool from public/data/top-vocab/<lang>/sentences.json:
// sentence text -> the list of vocab keys it contains.
import { loadJson } from '../../dumb/loadJson'

const MIN_WORD_COVERAGE_RATIO = 0.5

const sentencesCache = new Map<string, Promise<Map<string, string[]>>>()

export function getSentences(languageCode: string): Promise<Map<string, string[]>> {
  let promise = sentencesCache.get(languageCode)
  if (!promise) {
    promise = loadJson<Record<string, string[]>>(`/data/top-vocab/${languageCode}/sentences.json`).then(
      (record) => new Map(Object.entries(record))
    )
    sentencesCache.set(languageCode, promise)
  }
  return promise
}

// Rough heuristic from spec.md: a sentence is only eligible for practice if
// at least half as many words are attached to it as it actually contains
// (simple whitespace split) - filters out sentences with poor vocab tagging.
export function isSentenceEligible(text: string, wordKeys: string[]): boolean {
  const wordCount = text.split(/\s+/).filter(Boolean).length
  if (wordCount === 0) return false
  return wordKeys.length / wordCount >= MIN_WORD_COVERAGE_RATIO
}
