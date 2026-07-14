<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { FeatureCollection } from 'geojson'
import { useAppI18n } from '@/apps/world-map/app/i18n'
import { getGeoData } from '@/apps/world-map/entities/map-geo-data/mapGeoData'
import { loadNextExercise, submitAnswer, type NextExercise, type SubmittedAnswer } from '@/apps/world-map/entities/progress/progressScheduler'
import NeighborhoodExerciseView from './NeighborhoodExerciseView.vue'
import WorldMapExerciseView from './WorldMapExerciseView.vue'
import IdentifyCountryExerciseView from './IdentifyCountryExerciseView.vue'

type PageState = { mode: 'loading' } | { mode: 'no-exercises' } | { mode: 'exercise'; exercise: NextExercise }

const { t } = useAppI18n()

const state = ref<PageState>({ mode: 'loading' })
const geoData = ref<FeatureCollection | null>(null)

onMounted(async () => {
  geoData.value = await getGeoData()
  await loadNext()
})

async function loadNext() {
  state.value = { mode: 'loading' }
  const exercise = await loadNextExercise()
  state.value = exercise ? { mode: 'exercise', exercise } : { mode: 'no-exercises' }
}

async function handleSubmitted(result: SubmittedAnswer) {
  await submitAnswer(result)
  await loadNext()
}
</script>

<template>
  <section class="flex w-full max-w-2xl flex-col gap-4">
    <div
      v-if="state.mode === 'loading' || !geoData"
      class="flex justify-center py-16 text-sm text-base-content/70"
    >
      {{ t('loading.label') }}
    </div>

    <div
      v-else-if="state.mode === 'no-exercises'"
      class="flex flex-col items-center gap-2 py-16 text-center text-sm text-base-content/70"
    >
      <p>{{ t('noExercises.title') }}</p>
      <p>{{ t('noExercises.subtitle') }}</p>
    </div>

    <NeighborhoodExerciseView
      v-else-if="state.exercise.type === 'find-in-neighborhood'"
      :key="`neighborhood-${state.exercise.country}-${state.exercise.panIndex}`"
      :geo-data="geoData"
      :country="state.exercise.country"
      :zoom="state.exercise.zoom"
      :pan-index="state.exercise.panIndex"
      @submitted="handleSubmitted"
    />

    <IdentifyCountryExerciseView
      v-else-if="state.exercise.type === 'identify-country'"
      :key="`identify-${state.exercise.country}-${state.exercise.distractor}`"
      :geo-data="geoData"
      :country="state.exercise.country"
      :distractor="state.exercise.distractor"
      @submitted="handleSubmitted"
    />

    <WorldMapExerciseView
      v-else
      :key="`world-map-${state.exercise.country}`"
      :geo-data="geoData"
      :country="state.exercise.country"
      @submitted="handleSubmitted"
    />
  </section>
</template>
