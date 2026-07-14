export type CountryConfig = { enabled: boolean; zoom: number; distractors: string[] }
export type EnabledCountry = { country: string; zoom: number; distractors: string[] }

let configPromise: Promise<Record<string, CountryConfig>> | null = null

function loadConfig(): Promise<Record<string, CountryConfig>> {
  if (!configPromise) {
    configPromise = fetch('/data/world-map/distractor-choice-exercises.json').then((response) => response.json())
  }
  return configPromise
}

export async function getEnabledCountries(): Promise<EnabledCountry[]> {
  const config = await loadConfig()
  return Object.entries(config)
    .filter(([, value]) => value.enabled && value.distractors.length > 0)
    .map(([country, value]) => ({ country, zoom: value.zoom, distractors: value.distractors }))
}
