<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  type D3ZoomEvent,
  geoCentroid,
  type GeoProjection,
  geoMercator,
  geoPath,
  select,
  type Selection,
  zoom as d3zoom,
  type ZoomBehavior,
  zoomIdentity,
  type ZoomTransform
} from 'd3'
import type { Feature, FeatureCollection } from 'geojson'
import { Minus, Plus, RotateCcw } from 'lucide-vue-next'
import { computeGroupProjection, computeMapProjection, computeMarkerRadius, findCountryFeature, toZoomTransform } from './mapProjection'
import {
  COUNTRY_FILL_COLOR,
  HIGHLIGHT_COLOR,
  MAP_STROKE_COLOR,
  MAP_STROKE_WIDTH,
  MARKER_STROKE_WIDTH,
  WATER_COLOR,
  ZOOM_BUTTON_FACTOR,
  ZOOM_CLICK_DISTANCE,
  ZOOM_MAX_HEADROOM,
  ZOOM_SCALE_EXTENT,
  ZOOM_TRANSITION_MS
} from './mapStyle'

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

// Buttons are shown only for fine-pointer (mouse/trackpad) input; touch devices pinch/drag directly.
const isTouchDevice = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

const containerRef = ref<HTMLDivElement | null>(null)

// Single source of truth for the interactive pan/zoom. Every transform change - drag, wheel,
// pinch, a button, or a programmatic reset - flows through the d3 zoom behavior's own API
// (never set directly), which reports back here via the 'zoom' event. Nothing else may write to it.
//
// All map geometry is always drawn with one constant world projection, so k=1 always means "the
// whole world" - for every exercise, not just the ones without a target country. The exercise's own
// designed starting view (a country close-up, a group crop, ...) is expressed as a ZoomTransform on
// top of that world projection, not as a different base projection. That's what makes zooming out
// reach the real world map, and panning work like a normal map, instead of both being boxed in by
// whatever crop the exercise happened to start on.
const transform = ref<ZoomTransform>(zoomIdentity)
const maxScale = ref<number>(ZOOM_SCALE_EXTENT[1])
const canZoomIn = computed(() => transform.value.k < maxScale.value - 0.01)
const canZoomOut = computed(() => transform.value.k > ZOOM_SCALE_EXTENT[0] + 0.01)
const isAtInitialView = computed(() => {
  const t = transform.value
  return Math.abs(t.k - initialTransform.k) < 0.01 && Math.abs(t.x - initialTransform.x) < 0.5 && Math.abs(t.y - initialTransform.y) < 0.5
})

// D3 owns this SVG subtree once mounted: created exactly once, updated in place, never torn down
// and rebuilt. Rebuilding on every prop change was the source of earlier stale-state bugs (a resize
// or a click mid-gesture could recreate the SVG while a button/drag still referenced the old one).
let svg: Selection<SVGSVGElement, unknown, null, undefined> | null = null
let waterRect: Selection<SVGRectElement, unknown, null, undefined> | null = null
let g: Selection<SVGGElement, unknown, null, undefined> | null = null
let zoomBehavior: ZoomBehavior<SVGSVGElement, unknown> | null = null
let worldProjection: GeoProjection | null = null
let initialTransform: ZoomTransform = zoomIdentity
let resizeObserver: ResizeObserver | null = null

function handleZoomEvent(event: D3ZoomEvent<SVGSVGElement, unknown>) {
  transform.value = event.transform
  g?.attr('transform', event.transform.toString())
}

// Recomputes the world projection and redraws the (constant) map geometry for the current
// container size. Called on mount and on resize. Never touches the pan/zoom transform.
function updateWorldGeometry() {
  const container = containerRef.value
  if (!container || !svg || !waterRect || !g) return

  const width = container.clientWidth
  const height = container.clientHeight
  if (width === 0 || height === 0) return

  svg.attr('width', width).attr('height', height)
  waterRect.attr('width', width).attr('height', height)

  worldProjection = geoMercator().fitSize([width, height], props.geoData)
  const path = geoPath(worldProjection)

  g.selectAll<SVGPathElement, Feature>('path')
    .data(props.geoData.features, (feature) => feature.properties?.code ?? '')
    .join((enter) =>
      enter
        .append('path')
        .attr('data-country', (feature) => feature.properties?.code ?? '')
        .attr('stroke', MAP_STROKE_COLOR)
        .attr('stroke-width', MAP_STROKE_WIDTH)
        .style('cursor', 'pointer')
        .on('click', (_event, feature) => {
          const code = feature.properties?.code
          if (code) emit('countryClicked', code)
        })
    )
    .attr('d', (feature) => path(feature) ?? '')

  applyFills()
  updateInitialTransform()
}

// Recomputes the exercise's designed starting view (target country/zoom-stage/group) as a
// ZoomTransform against the world projection, and the zoom bounds that go with it. Called on mount,
// on resize, and whenever the exercise changes to a genuinely new view.
function updateInitialTransform() {
  const container = containerRef.value
  if (!container || !worldProjection) return

  const width = container.clientWidth
  const height = container.clientHeight
  if (width === 0 || height === 0) return

  const targetProjection = props.groupCountries?.length
    ? computeGroupProjection({ geoData: props.geoData, width, height, groupCountries: props.groupCountries })
    : computeMapProjection({
        geoData: props.geoData,
        width,
        height,
        targetCountry: props.targetCountry,
        zoom: props.zoom,
        panIndex: props.panIndex
      })

  // For a few very large countries, fitting just that country alone can paradoxically need a
  // smaller scale than fitting the whole world (an unusual bounding-box aspect ratio). That would
  // place the exercise's own starting view below the k=1 world floor, so fall back to the world
  // view rather than let the interactive zoom immediately snap the user out of their starting spot.
  const candidate = toZoomTransform(worldProjection, targetProjection)
  initialTransform = candidate.k < 1 ? zoomIdentity : candidate
  maxScale.value = Math.max(ZOOM_SCALE_EXTENT[1], initialTransform.k * ZOOM_MAX_HEADROOM)

  zoomBehavior?.scaleExtent([ZOOM_SCALE_EXTENT[0], maxScale.value])
  zoomBehavior?.translateExtent([
    [0, 0],
    [width, height]
  ])

  applyMarker()
}

function applyFills() {
  if (!g) return
  const secondarySet = new Set(props.secondaryHighlightCountries ?? [])
  g.selectAll<SVGPathElement, Feature>('path').attr('fill', (feature) => {
    const code = feature.properties?.code
    if (code === props.highlightCountry) return props.highlightColor ?? HIGHLIGHT_COLOR
    if (code && secondarySet.has(code)) return props.secondaryHighlightColor ?? HIGHLIGHT_COLOR
    return COUNTRY_FILL_COLOR
  })
}

function applyMarker() {
  if (!g || !containerRef.value || !worldProjection) return
  g.selectAll('circle').remove()

  const markerFeature = props.markerCountry ? findCountryFeature(props.geoData, props.markerCountry) : undefined
  if (!markerFeature) return

  const [cx, cy] = worldProjection(geoCentroid(markerFeature)) ?? [0, 0]
  const radius = computeMarkerRadius(containerRef.value.clientWidth, containerRef.value.clientHeight)
  g.append('circle')
    .attr('cx', cx)
    .attr('cy', cy)
    .attr('r', radius)
    .attr('fill', 'none')
    .attr('stroke', props.markerColor ?? HIGHLIGHT_COLOR)
    .attr('stroke-width', MARKER_STROKE_WIDTH)
    .style('pointer-events', 'none')
}

function resetTransform(animate: boolean) {
  if (!svg || !zoomBehavior) return
  const target = animate ? svg.transition().duration(ZOOM_TRANSITION_MS) : svg
  target.call(zoomBehavior.transform, initialTransform)
}

function zoomBy(factor: number) {
  if (!svg || !zoomBehavior) return
  svg.transition().duration(ZOOM_TRANSITION_MS).call(zoomBehavior.scaleBy, factor)
}

onMounted(() => {
  const container = containerRef.value
  if (!container) return

  svg = select(container).append('svg')
  waterRect = svg.append('rect').attr('fill', WATER_COLOR)
  g = svg.append('g')

  // `interactive` is static per usage (never toggled at runtime by any caller), so it's read once
  // here rather than reactively - the zoom behavior is either wired up for the component's whole
  // lifetime or not at all.
  if (props.interactive) {
    zoomBehavior = d3zoom<SVGSVGElement, unknown>().clickDistance(ZOOM_CLICK_DISTANCE).on('zoom', handleZoomEvent)
    // Double-click/double-tap-to-zoom is disabled: it collides with double-tapping a country to
    // retry a guess, and zooming is already covered by pinch, wheel, and the explicit buttons.
    svg.call(zoomBehavior).on('dblclick.zoom', null)
  }

  updateWorldGeometry()
  resetTransform(false)

  resizeObserver = new ResizeObserver(() => updateWorldGeometry())
  resizeObserver.observe(container)
})

onUnmounted(() => resizeObserver?.disconnect())

// A new target/zoom-stage/group is a genuinely new view: recompute its starting transform and snap
// the interactive pan/zoom to it, so the user isn't left panned/zoomed away on the previous view.
watch(
  () => [props.targetCountry, props.zoom, props.panIndex, props.groupCountries],
  () => {
    updateInitialTransform()
    resetTransform(false)
  }
)

watch(() => props.geoData, updateWorldGeometry)
watch(() => [props.highlightCountry, props.highlightColor, props.secondaryHighlightCountries, props.secondaryHighlightColor], applyFills)
watch(() => [props.markerCountry, props.markerColor], applyMarker)
</script>

<template>
  <div
    ref="containerRef"
    class="relative h-full w-full"
    :class="{ 'touch-none overscroll-contain': interactive }"
  >
    <div
      v-if="interactive"
      class="pointer-events-none absolute top-1/2 right-3 flex -translate-y-1/2 flex-col gap-2"
    >
      <button
        v-if="!isTouchDevice"
        type="button"
        class="btn btn-circle pointer-events-auto bg-base-100/90 text-base-content shadow-sm backdrop-blur"
        :disabled="!canZoomIn"
        aria-label="Zoom in"
        @click="zoomBy(ZOOM_BUTTON_FACTOR)"
      >
        <Plus
          :size="20"
          aria-hidden="true"
        />
      </button>
      <button
        v-if="!isTouchDevice"
        type="button"
        class="btn btn-circle pointer-events-auto bg-base-100/90 text-base-content shadow-sm backdrop-blur"
        :disabled="!canZoomOut"
        aria-label="Zoom out"
        @click="zoomBy(1 / ZOOM_BUTTON_FACTOR)"
      >
        <Minus
          :size="20"
          aria-hidden="true"
        />
      </button>
      <button
        type="button"
        class="btn btn-circle pointer-events-auto bg-base-100/90 text-base-content shadow-sm backdrop-blur"
        :disabled="isAtInitialView"
        aria-label="Reset view"
        @click="resetTransform(true)"
      >
        <RotateCcw
          :size="20"
          aria-hidden="true"
        />
      </button>
    </div>
  </div>
</template>
