<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import type { FeatureCollection } from 'geojson'
import { useAppI18n } from '@/apps/world-map/app/i18n'
import { getGeoData } from '@/apps/world-map/entities/map-geo-data/mapGeoData'
import { loadNextExercise, submitAnswer, type NextExercise, type SubmittedAnswer } from '@/apps/world-map/entities/progress/progressScheduler'
import { startPracticeTimeTracking, stopPracticeTimeTracking } from '@/apps/world-map/entities/practice-time/practiceTime'
import NeighborhoodExerciseView from './NeighborhoodExerciseView.vue'
import WorldMapExerciseView from './WorldMapExerciseView.vue'
import IdentifyCountryExerciseView from './IdentifyCountryExerciseView.vue'
import DistractorChoiceExerciseView from './DistractorChoiceExerciseView.vue'
import GroupSequenceExerciseView from './GroupSequenceExerciseView.vue'

type PageState = { mode: 'loading' } | { mode: 'no-exercises' } | { mode: 'exercise'; exercise: NextExercise }

const { t } = useAppI18n()

const state = ref<PageState>({ mode: 'loading' })
const geoData = ref<FeatureCollection | null>(null)

onMounted(async () => {
  startPracticeTimeTracking()
  geoData.value = await getGeoData()
  await loadNext()
})

onUnmounted(() => {
  stopPracticeTimeTracking()
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
  <section class="relative h-dvh w-full overflow-hidden">
    <div
      v-if="state.mode === 'loading' || !geoData"
      class="flex h-full items-center justify-center text-sm text-base-content/70"
    >
      {{ t('loading.label') }}
    </div>

    <div
      v-else-if="state.mode === 'no-exercises'"
      class="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-base-content/70"
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

    <DistractorChoiceExerciseView
      v-else-if="state.exercise.type === 'distractor-choice'"
      :key="`distractor-choice-${state.exercise.country}-${state.exercise.distractor}`"
      :geo-data="geoData"
      :country="state.exercise.country"
      :distractor="state.exercise.distractor"
      :zoom="state.exercise.zoom"
      :pan-index="state.exercise.panIndex"
      @submitted="handleSubmitted"
    />

    <GroupSequenceExerciseView
      v-else-if="state.exercise.type === 'group-sequence'"
      :key="`group-${state.exercise.groupId}-${state.exercise.countries.join('-')}`"
      :geo-data="geoData"
      :group-id="state.exercise.groupId"
      :countries="state.exercise.countries"
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
