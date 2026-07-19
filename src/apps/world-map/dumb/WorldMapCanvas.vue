<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { geoCentroid, geoPath, select, zoom as d3zoom, zoomIdentity } from 'd3'
import type { FeatureCollection } from 'geojson'
import { computeGroupProjection, computeMapProjection, computeMarkerRadius, findCountryFeature } from './mapProjection'
import { COUNTRY_FILL_COLOR, HIGHLIGHT_COLOR, MAP_STROKE_COLOR, MAP_STROKE_WIDTH, MARKER_STROKE_WIDTH, WATER_COLOR, ZOOM_SCALE_EXTENT } from './mapStyle'

const props = defineProps<{
  geoData: FeatureCollection
  targetCountry?: string
  zoom?: number
  panIndex?: number
  groupCountries?: string[]
  highlightCountry?: string
  highlightColor?: string
  secondaryHighlightCountries?: string[]
  secondaryHighlightColor?: string
  markerCountry?: string
  markerColor?: string
  interactive?: boolean
}>()

const emit = defineEmits<{
  countryClicked: [country: string]
}>()

const containerRef = ref<HTMLDivElement | null>(null)
let resizeObserver: ResizeObserver | null = null

function render() {
  const container = containerRef.value
  if (!container) return

  const width = container.clientWidth
  const height = container.clientHeight
  if (width === 0 || height === 0) return

  container.querySelector('svg')?.remove()
  const svg = select(container).append('svg').attr('width', width).attr('height', height)
  svg.append('rect').attr('width', width).attr('height', height).attr('fill', WATER_COLOR)
  const g = svg.append('g')

  const projection = props.groupCountries?.length
    ? computeGroupProjection({ geoData: props.geoData, width, height, groupCountries: props.groupCountries })
    : computeMapProjection({
        geoData: props.geoData,
        width,
        height,
        targetCountry: props.targetCountry,
        zoom: props.zoom,
        panIndex: props.panIndex
      })
  const path = geoPath(projection)
  const secondaryHighlightSet = new Set(props.secondaryHighlightCountries ?? [])

  g.selectAll('path')
    .data(props.geoData.features)
    .enter()
    .append('path')
    .attr('d', (feature) => path(feature) ?? '')
    .attr('data-country', (feature) => feature.properties?.code ?? '')
    .attr('stroke', MAP_STROKE_COLOR)
    .attr('stroke-width', MAP_STROKE_WIDTH)
    .attr('fill', (feature) => {
      const code = feature.properties?.code
      if (code === props.highlightCountry) return props.highlightColor ?? HIGHLIGHT_COLOR
      if (code && secondaryHighlightSet.has(code)) return props.secondaryHighlightColor ?? HIGHLIGHT_COLOR
      return COUNTRY_FILL_COLOR
    })
    .style('cursor', 'pointer')
    .on('click', (_event, feature) => {
      const code = feature.properties?.code
      if (code) emit('countryClicked', code)
    })

  const markerFeature = props.markerCountry ? findCountryFeature(props.geoData, props.markerCountry) : undefined
  if (markerFeature) {
    const [cx, cy] = projection(geoCentroid(markerFeature)) ?? [0, 0]
    const radius = computeMarkerRadius(width, height)
    g.append('circle')
      .attr('cx', cx)
      .attr('cy', cy)
      .attr('r', radius)
      .attr('fill', 'none')
      .attr('stroke', props.markerColor ?? HIGHLIGHT_COLOR)
      .attr('stroke-width', MARKER_STROKE_WIDTH)
      .style('pointer-events', 'none')
  }

  if (props.interactive) {
    const behavior = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent(ZOOM_SCALE_EXTENT)
      .translateExtent([
        [0, 0],
        [width, height]
      ])
      .on('zoom', (event) => g.attr('transform', event.transform.toString()))
    svg.call(behavior).call(behavior.transform, zoomIdentity)
  }
}

onMounted(() => {
  render()
  resizeObserver = new ResizeObserver(() => render())
  if (containerRef.value) resizeObserver.observe(containerRef.value)
})

onUnmounted(() => resizeObserver?.disconnect())

watch(
  () => [
    props.geoData,
    props.targetCountry,
    props.zoom,
    props.panIndex,
    props.groupCountries,
    props.highlightCountry,
    props.highlightColor,
    props.secondaryHighlightCountries,
    props.secondaryHighlightColor,
    props.markerCountry,
    props.markerColor
  ],
  render
)
</script>

<template>
  <div
    ref="containerRef"
    class="h-full w-full"
  />
</template>
