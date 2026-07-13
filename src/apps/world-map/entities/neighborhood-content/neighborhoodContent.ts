export type CountryConfig = { enabled: boolean; zoom: number }
export type EnabledCountry = { country: string; zoom: number }

let configPromise: Promise<Record<string, CountryConfig>> | null = null

function loadConfig(): Promise<Record<string, CountryConfig>> {
  if (!configPromise) {
    configPromise = fetch('/data/world-map/neighborhood-exercises.json').then((response) => response.json())
  }
  return configPromise
}

export async function getEnabledCountries(): Promise<EnabledCountry[]> {
  const config = await loadConfig()
  return Object.entries(config)
    .filter(([, value]) => value.enabled)
    .map(([country, value]) => ({ country, zoom: value.zoom }))
}
