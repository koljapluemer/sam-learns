export type WorldMapCountryConfig = { enabled: boolean }
export type EnabledCountry = { country: string }

let configPromise: Promise<Record<string, WorldMapCountryConfig>> | null = null

function loadConfig(): Promise<Record<string, WorldMapCountryConfig>> {
  if (!configPromise) {
    configPromise = fetch('/data/world-map/world-map-exercises.json').then((response) => response.json())
  }
  return configPromise
}

export async function getEnabledCountries(): Promise<EnabledCountry[]> {
  const config = await loadConfig()
  return Object.entries(config)
    .filter(([, value]) => value.enabled)
    .map(([country]) => ({ country }))
}
