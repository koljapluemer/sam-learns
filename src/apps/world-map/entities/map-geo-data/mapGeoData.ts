import type { FeatureCollection } from 'geojson'

let geoDataPromise: Promise<FeatureCollection> | null = null

export function getGeoData(): Promise<FeatureCollection> {
  if (!geoDataPromise) {
    geoDataPromise = fetch('/data/world-map/map.geo.json').then((response) => response.json())
  }
  return geoDataPromise
}
