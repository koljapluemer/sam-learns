// Port of linguanodon's tprboard app/data.js, pointed at this app's static
// JSON export (public/data/tprboard/*.json, written by
// cms/tprboard/import_from_linguanodon.py) instead of the Django API
// endpoints the original fetched from.
import type { LanguageOption, LocaleTaskMap, PlacedObject } from './types'

async function loadJson<T>(url: string, errorMessage: string): Promise<T> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`${errorMessage} (${response.status} ${response.statusText})`)
  }

  return response.json() as Promise<T>
}

export async function loadLanguageOptions(): Promise<LanguageOption[]> {
  const catalog = await loadJson<Record<string, string>>('/data/tprboard/languages.json', 'Failed to load language index.')

  return Object.entries(catalog).map(([code, name]) => ({ code, name }))
}

export async function loadLocaleTaskMap(languageCode: string): Promise<LocaleTaskMap> {
  return loadJson(`/data/tprboard/tasks/${languageCode}.json`, `Failed to load locale task strings: ${languageCode}.`)
}

export async function loadObjectPool(): Promise<PlacedObject[]> {
  return loadJson('/data/tprboard/objects.json', 'Failed to load object pool.')
}
