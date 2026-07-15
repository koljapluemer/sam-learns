import { geoCentroid, geoMercator, type GeoProjection } from 'd3'
import type { Feature, FeatureCollection } from 'geojson'

export const PAN_GRID_SIZE = 3

const ZOOM_MIN = 100
const ZOOM_RANGE = 75
const ZOOM_COUNTRY_WEIGHT = 0.6

const MARKER_TARGET_RADIUS_PX = 15
const MARKER_MIN_FRACTION = 0.03
const MARKER_MAX_FRACTION = 0.14

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

export function zoomProgress(zoomLevel: number | undefined): number {
  if (!zoomLevel) return 0
  return clamp01((zoomLevel - ZOOM_MIN) / ZOOM_RANGE)
}

export function interpolateScale(worldScale: number, countryScale: number, progress: number): number {
  const maxZoomScale = worldScale + (countryScale - worldScale) * ZOOM_COUNTRY_WEIGHT
  return worldScale + (maxZoomScale - worldScale) * progress
}

export function panIndexToTranslate(panIndex: number, width: number, height: number): [number, number] {
  const cellWidth = width / PAN_GRID_SIZE
  const cellHeight = height / PAN_GRID_SIZE
  const cellX = panIndex % PAN_GRID_SIZE
  const cellY = Math.floor(panIndex / PAN_GRID_SIZE)
  return [cellX * cellWidth + cellWidth / 2, cellY * cellHeight + cellHeight / 2]
}

export function findCountryFeature(geoData: FeatureCollection, countryCode: string): Feature | undefined {
  return geoData.features.find((feature) => feature.properties?.code === countryCode)
}

export function getCountryDisplayName(geoData: FeatureCollection, countryCode: string): string {
  return findCountryFeature(geoData, countryCode)?.properties?.name ?? countryCode
}

export function computeMarkerRadius(width: number, height: number): number {
  const base = Math.min(width, height)
  const min = base * MARKER_MIN_FRACTION
  const max = base * MARKER_MAX_FRACTION
  return Math.min(Math.max(MARKER_TARGET_RADIUS_PX, min), max)
}

export function computeMapProjection(input: {
  geoData: FeatureCollection
  width: number
  height: number
  targetCountry?: string
  zoom?: number
  panIndex?: number
}): GeoProjection {
  const worldProjection = geoMercator().fitSize([input.width, input.height], input.geoData)
  const targetFeature = input.targetCountry ? findCountryFeature(input.geoData, input.targetCountry) : undefined
  if (!targetFeature) return worldProjection

  const progress = zoomProgress(input.zoom)
  if (progress <= 0) return worldProjection

  const worldScale = worldProjection.scale()
  const countryScale = geoMercator().fitSize([input.width, input.height], targetFeature).scale()
  const scale = interpolateScale(worldScale, countryScale, progress)
  const centroid = geoCentroid(targetFeature)
  const translate = panIndexToTranslate(input.panIndex ?? 4, input.width, input.height)

  return geoMercator().center(centroid).scale(scale).translate(translate)
}
