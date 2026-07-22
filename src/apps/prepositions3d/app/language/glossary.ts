// Ported from linguanodon's prepositions3d app/language/glossary.js - loads
// this repo's static export (public/data/prepositions3d/{languages,glossary}.json)
// instead of the original's Django API endpoints.
import type { GlossKey, LanguageCode } from '../types'

export type LanguageOption = { code: LanguageCode; displayName: string }
export type GlossPrompt = { text: string; audioUrl: string | null }
type GlossEntry = Record<string, unknown> & { audio?: Partial<Record<LanguageCode, string>> }
type Glosses = Record<GlossKey, GlossEntry>
type Languages = Record<LanguageCode, string>

let glosses: Glosses | null = null
let languages: Languages | null = null

export const DEFAULT_LANGUAGE = 'deu'

export async function loadGlossaryData(languagesUrl: string, glossaryUrl: string): Promise<void> {
  const [loadedGlosses, loadedLanguages] = await Promise.all([fetchJson(glossaryUrl), fetchJson(languagesUrl)])
  glosses = loadedGlosses as Glosses
  languages = loadedLanguages as Languages
}

export function getLanguageOptions(): LanguageOption[] {
  return Object.entries(getLanguages()).map(([code, displayName]) => ({
    code,
    displayName
  }))
}

export function hasGloss(glossKey: GlossKey, language: LanguageCode): boolean {
  return typeof getGlosses()[glossKey]?.[language] === 'string'
}

export function getGloss(glossKey: GlossKey, language: LanguageCode): string {
  const entry = getGlosses()[glossKey]
  const localized = entry?.[language]
  const english = entry?.eng
  if (typeof localized === 'string') return localized
  if (typeof english === 'string') return english
  return glossKey
}

export function getGlossAudioUrl(glossKey: GlossKey, language: LanguageCode): string | null {
  return getGlosses()[glossKey]?.audio?.[language] ?? null
}

export function getGlossPrompt(glossKey: GlossKey, language: LanguageCode): GlossPrompt {
  return {
    text: getGloss(glossKey, language),
    audioUrl: getGlossAudioUrl(glossKey, language)
  }
}

export function getGlossKeysWithLanguage(glossKeys: GlossKey[], language: LanguageCode): GlossKey[] {
  return glossKeys.filter((glossKey) => hasGloss(glossKey, language))
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load glossary data "${url}": ${response.status} ${response.statusText}`)
  }
  return response.json()
}

function getGlosses(): Glosses {
  if (!glosses) throw new Error('Glossary data has not loaded.')
  return glosses
}

function getLanguages(): Languages {
  if (!languages) throw new Error('Glossary data has not loaded.')
  return languages
}
