type CountriesData = Record<string, { neighborhood?: { enabled: boolean; zoom: number } }>
export type EnabledCountry = { country: string; zoom: number }

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
    .filter(([, value]) => value.neighborhood?.enabled)
    .map(([country, value]) => ({ country, zoom: value.neighborhood!.zoom }))
}
