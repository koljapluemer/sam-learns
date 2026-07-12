<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { geoPath, select } from 'd3'
import type { FeatureCollection } from 'geojson'
import { computeMapProjection } from './mapProjection'

const props = defineProps<{
  geoData: FeatureCollection
  targetCountry?: string
  zoom?: number
  panIndex?: number
  highlightCountry?: string
  highlightColor?: string
}>()

const emit = defineEmits<{
  countryClicked: [country: string]
}>()

const DEFAULT_FILL = '#cbd5e1'

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

  const projection = computeMapProjection({
    geoData: props.geoData,
    width,
    height,
    targetCountry: props.targetCountry,
    zoom: props.zoom,
    panIndex: props.panIndex
  })
  const path = geoPath(projection)

  svg
    .selectAll('path')
    .data(props.geoData.features)
    .enter()
    .append('path')
    .attr('d', (feature) => path(feature) ?? '')
    .attr('data-country', (feature) => feature.properties?.name ?? '')
    .attr('stroke', '#f8fafc')
    .attr('stroke-width', 0.5)
    .attr('fill', (feature) =>
      feature.properties?.name === props.highlightCountry ? (props.highlightColor ?? DEFAULT_FILL) : DEFAULT_FILL
    )
    .style('cursor', 'pointer')
    .on('click', (_event, feature) => {
      const name = feature.properties?.name
      if (name) emit('countryClicked', name)
    })
}

onMounted(() => {
  render()
  resizeObserver = new ResizeObserver(() => render())
  if (containerRef.value) resizeObserver.observe(containerRef.value)
})

onUnmounted(() => resizeObserver?.disconnect())

watch(() => [props.geoData, props.targetCountry, props.zoom, props.panIndex, props.highlightCountry, props.highlightColor], render)
</script>

<template>
  <div
    ref="containerRef"
    class="h-full w-full"
  />
</template>
