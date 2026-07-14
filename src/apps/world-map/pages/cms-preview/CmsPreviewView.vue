<script setup lang="ts">
import type { FeatureCollection } from 'geojson'
import WorldMapCanvas from '@/apps/world-map/dumb/WorldMapCanvas.vue'

defineProps<{
  geoData: FeatureCollection
  country: string
  zoom: number
  panIndex: number
  highlight: boolean
  marker: boolean
  distractors?: string[]
}>()

const CMS_HIGHLIGHT_COLOR = '#f59e0b'
const CMS_DISTRACTOR_COLOR = '#a855f7'
</script>

<template>
  <WorldMapCanvas
    :geo-data="geoData"
    :target-country="country"
    :zoom="zoom"
    :pan-index="panIndex"
    :highlight-country="highlight ? country : undefined"
    :highlight-color="highlight ? CMS_HIGHLIGHT_COLOR : undefined"
    :secondary-highlight-countries="highlight ? distractors : undefined"
    :secondary-highlight-color="CMS_DISTRACTOR_COLOR"
    :marker-country="marker ? country : undefined"
    :marker-color="CMS_HIGHLIGHT_COLOR"
  />
</template>
