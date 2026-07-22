// Fetch wrappers over the static JSON exported by
// cms/infinitesentences/import_from_linguanodon.py - replaces linguanodon's
// app/api.js Django JSON-endpoint fetches (loadLanguages/loadSentenceCount/
// loadSentenceByIndex etc.), since there's no server here.

import type { Language, LanguagePair, SentencesByIndex } from './types'

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Request failed (${response.status}): ${url}`)
  return (await response.json()) as T
}

export function loadLanguages(): Promise<Language[]> {
  return fetchJson<Language[]>('/data/infinitesentences/languages.json')
}

export function loadPairs(): Promise<LanguagePair[]> {
  return fetchJson<LanguagePair[]>('/data/infinitesentences/pairs.json')
}

export function loadSentencesForPair(nativeIso: string, targetIso: string): Promise<SentencesByIndex> {
  return fetchJson<SentencesByIndex>(`/data/infinitesentences/sentences/${nativeIso}-${targetIso}.json`)
}
