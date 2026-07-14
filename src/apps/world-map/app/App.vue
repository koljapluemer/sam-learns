<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Globe } from 'lucide-vue-next'
import type { FeatureCollection } from 'geojson'
import { locales, useAppI18n } from './i18n'
import { useAppShell } from '@/shared/shell/shellState'
import { getGeoData } from '@/apps/world-map/entities/map-geo-data/mapGeoData'

const ExercisePage = defineAsyncComponent(() => import('../pages/exercise/PageExercise.vue'))
const CmsPreviewView = defineAsyncComponent(() => import('../pages/cms-preview/CmsPreviewView.vue'))

const { t } = useAppI18n()
const route = useRoute()

const isPreview = computed(() => route.query.preview === '1')
const previewCountry = computed(() => String(route.query.country ?? ''))
const previewZoom = computed(() => Number(route.query.zoom ?? 100))
const previewPanIndex = computed(() => Number(route.query.panIndex ?? 4))
const previewHighlight = computed(() => route.query.highlight === '1')
const previewMarker = computed(() => route.query.marker === '1')

const geoData = ref<FeatureCollection | null>(null)

onMounted(async () => {
  if (isPreview.value) {
    geoData.value = await getGeoData()
  }
})

if (!isPreview.value) {
  useAppShell(() => ({ title: t('app.title'), icon: Globe, layout: 'contained', locales }))
}
</script>

<template>
  <div
    v-if="isPreview"
    class="h-screen w-screen"
  >
    <CmsPreviewView
      v-if="geoData"
      :geo-data="geoData"
      :country="previewCountry"
      :zoom="previewZoom"
      :pan-index="previewPanIndex"
      :highlight="previewHighlight"
      :marker="previewMarker"
    />
  </div>

  <Suspense v-else>
    <ExercisePage />
    <template #fallback>
      <div class="flex w-full max-w-xl items-center justify-center rounded-box border border-base-300 bg-base-100 p-10 text-sm text-base-content/70">
        {{ t('loading.label') }}
      </div>
    </template>
  </Suspense>
</template>
