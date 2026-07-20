type CountriesData = Record<string, { learningPriority?: number }>

let dataPromise: Promise<CountriesData> | null = null

function loadData(): Promise<CountriesData> {
  if (!dataPromise) {
    dataPromise = fetch('/data/world-map/countries.json').then((response) => response.json())
  }
  return dataPromise
}

// countries absent from countries.json (no curated exercise at all) or with
// no curated learningPriority get the baseline priority, matching the CMS's
// export default (see cms/world_map/data_io.py: priority_by_country)
const DEFAULT_PRIORITY = 2

export async function getPriorityByCountry(): Promise<Map<string, number>> {
  const data = await loadData()
  return new Map(Object.entries(data).map(([country, value]) => [country, value.learningPriority ?? DEFAULT_PRIORITY]))
}

export { DEFAULT_PRIORITY }
