type CountriesData = Record<string, { distractorChoice?: { enabled: boolean; zoom: number; distractors: string[] } }>
export type EnabledCountry = { country: string; zoom: number; distractors: string[] }

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
    .filter(([, value]) => value.distractorChoice?.enabled && value.distractorChoice.distractors.length > 0)
    .map(([country, value]) => ({ country, zoom: value.distractorChoice!.zoom, distractors: value.distractorChoice!.distractors }))
}
