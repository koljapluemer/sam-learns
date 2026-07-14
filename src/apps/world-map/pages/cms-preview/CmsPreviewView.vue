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
}>()

const CMS_HIGHLIGHT_COLOR = '#f59e0b'
</script>

<template>
  <WorldMapCanvas
    :geo-data="geoData"
    :target-country="country"
    :zoom="zoom"
    :pan-index="panIndex"
    :highlight-country="highlight ? country : undefined"
    :highlight-color="highlight ? CMS_HIGHLIGHT_COLOR : undefined"
    :marker-country="marker ? country : undefined"
    :marker-color="CMS_HIGHLIGHT_COLOR"
  />
</template>
