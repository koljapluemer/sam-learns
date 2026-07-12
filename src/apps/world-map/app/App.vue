<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Globe } from 'lucide-vue-next'
import type { FeatureCollection } from 'geojson'
import { useAppI18n } from './i18n'
import WorldMapCanvas from '@/apps/world-map/dumb/WorldMapCanvas.vue'
import { getGeoData } from '@/apps/world-map/entities/neighborhood-content/neighborhoodContent'

const ExercisePage = defineAsyncComponent(() => import('../pages/exercise/PageExercise.vue'))

const { t } = useAppI18n()
const route = useRoute()

const isPreview = computed(() => route.query.preview === '1')
const previewCountry = computed(() => String(route.query.country ?? ''))
const previewZoom = computed(() => Number(route.query.zoom ?? 100))
const previewPanIndex = computed(() => Number(route.query.panIndex ?? 4))

const geoData = ref<FeatureCollection | null>(null)

onMounted(async () => {
  if (isPreview.value) {
    geoData.value = await getGeoData()
  }
})
</script>

<template>
  <div
    v-if="isPreview"
    class="h-screen w-screen"
  >
    <WorldMapCanvas
      v-if="geoData"
      :geo-data="geoData"
      :target-country="previewCountry"
      :zoom="previewZoom"
      :pan-index="previewPanIndex"
    />
  </div>

  <div
    v-else
    data-theme="light"
    class="flex min-h-screen w-full flex-col bg-base-100 text-base-content"
  >
    <nav class="navbar border-b border-base-300 bg-base-100/95 shadow-sm">
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <Globe
            :size="24"
            aria-hidden="true"
          />
          <span class="text-lg font-semibold">{{ t('app.title') }}</span>
        </div>
      </div>
    </nav>
    <main class="flex w-full flex-1 justify-center bg-base-200/40 px-4 py-8">
      <Suspense>
        <ExercisePage />
        <template #fallback>
          <div class="flex w-full max-w-xl items-center justify-center rounded-box border border-base-300 bg-base-100 p-10 text-sm text-base-content/70">
            {{ t('loading.label') }}
          </div>
        </template>
      </Suspense>
    </main>
  </div>
</template>
