<script setup lang="ts">
import type { FeatureCollection } from 'geojson'
import WorldMapCanvas from '@/apps/world-map/dumb/WorldMapCanvas.vue'
import { CMS_DISTRACTOR_COLOR, CMS_HIGHLIGHT_COLOR } from '@/apps/world-map/dumb/mapStyle'

defineProps<{
  geoData: FeatureCollection
  country: string
  zoom: number
  panIndex: number
  highlight: boolean
  marker: boolean
  distractors?: string[]
}>()
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
