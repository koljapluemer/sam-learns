type CountriesData = Record<string, { worldMap?: { enabled: boolean } }>
export type EnabledCountry = { country: string }

let dataPromise: Promise<CountriesData> | null = null

function loadData(): Promise<CountriesData> {
  if (!dataPromise) {
    dataPromise = fetch('/data/world-map/countries.json').then((response) => response.json())
  }
  return dataPromise
}

export async function getEnabledCountries(): Promise<EnabledCountry[]> {
  const data = await loadData()
  return Object.entries(data)
    .filter(([, value]) => value.worldMap?.enabled)
    .map(([country]) => ({ country }))
}
