// Reads the static phrase catalog from public/data/phrases/, curated by the
// phrases CMS (cms/phrases/). Per language: <code>.json holds every
// communication goal and its target-language expressions, and
// <code>/audio/<slug>.mp3 holds each expression's clip (see
// dumb/slugify.ts for the filename convention).
import { slugify } from '../../dumb/slugify'

export type PhraseLanguage = { code: string; name: string }
export type PhraseExpression = { text: string; note?: string }
export type PhraseGoal = { key: string; expressions: PhraseExpression[] }

type RawExpressionEntry = { note?: string }
type RawGoalEntry = { expressions: Record<string, RawExpressionEntry> }
type RawLanguageContent = Record<string, RawGoalEntry>

async function loadJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to load ${url} (${response.status})`)
  return response.json() as Promise<T>
}

let languagesPromise: Promise<PhraseLanguage[]> | null = null

export function getLanguages(): Promise<PhraseLanguage[]> {
  languagesPromise ??= loadJson<Record<string, string>>('/data/phrases/languages.json').then((record) =>
    Object.entries(record).map(([code, name]) => ({ code, name }))
  )
  return languagesPromise
}

const languageGoalsCache = new Map<string, Promise<PhraseGoal[]>>()

export function getLanguageGoals(languageCode: string): Promise<PhraseGoal[]> {
  let promise = languageGoalsCache.get(languageCode)
  if (!promise) {
    promise = loadJson<RawLanguageContent>(`/data/phrases/${languageCode}.json`).then((record) =>
      Object.entries(record).map(([key, goal]) => ({
        key,
        expressions: Object.entries(goal.expressions).map(([text, entry]) => ({ text, note: entry.note }))
      }))
    )
    languageGoalsCache.set(languageCode, promise)
  }
  return promise
}

export function getExpressionAudioUrl(languageCode: string, expressionText: string): string {
  return `/data/phrases/${languageCode}/audio/${slugify(expressionText)}.mp3`
}
