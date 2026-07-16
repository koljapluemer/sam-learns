type GroupsData = Record<string, { name: string; countries: string[]; enabled: boolean }>
export type CountryGroup = { id: string; name: string; countries: string[] }

let dataPromise: Promise<GroupsData> | null = null

function loadData(): Promise<GroupsData> {
  if (!dataPromise) {
    dataPromise = fetch('/data/world-map/groups.json').then((response) => response.json())
  }
  return dataPromise
}

export async function getEnabledGroups(): Promise<CountryGroup[]> {
  const data = await loadData()
  return Object.entries(data)
    .filter(([, value]) => value.enabled && value.countries.length > 0)
    .map(([id, value]) => ({ id, name: value.name, countries: value.countries }))
}
