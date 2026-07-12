import type { FeatureCollection } from 'geojson'

export type CountryConfig = { enabled: boolean; zoom: number }
export type EnabledCountry = { country: string; zoom: number }

let geoDataPromise: Promise<FeatureCollection> | null = null
let configPromise: Promise<Record<string, CountryConfig>> | null = null

function loadGeoData(): Promise<FeatureCollection> {
  if (!geoDataPromise) {
    geoDataPromise = fetch('/data/world-map/map.geo.json').then((response) => response.json())
  }
  return geoDataPromise
}

function loadConfig(): Promise<Record<string, CountryConfig>> {
  if (!configPromise) {
    configPromise = fetch('/data/world-map/neighborhood-exercises.json').then((response) => response.json())
  }
  return configPromise
}

export function getGeoData(): Promise<FeatureCollection> {
  return loadGeoData()
}

export async function getEnabledCountries(): Promise<EnabledCountry[]> {
  const config = await loadConfig()
  return Object.entries(config)
    .filter(([, value]) => value.enabled)
    .map(([country, value]) => ({ country, zoom: value.zoom }))
}
