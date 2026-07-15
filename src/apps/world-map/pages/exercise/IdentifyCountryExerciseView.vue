<script setup lang="ts">
import { ref, watch } from 'vue'
import type { FeatureCollection } from 'geojson'
import { useAppI18n } from '@/apps/world-map/app/i18n'
import WorldMapCanvas from '@/apps/world-map/dumb/WorldMapCanvas.vue'
import { getCountryDisplayName } from '@/apps/world-map/dumb/mapProjection'
import type { SubmittedAnswer } from '@/apps/world-map/entities/progress/progressScheduler'

const props = defineProps<{
  geoData: FeatureCollection
  country: string
  distractor: string
}>()

const emit = defineEmits<{
  submitted: [result: SubmittedAnswer]
}>()

const { t } = useAppI18n()

const MARKER_COLOR = '#3b82f6'
const SUCCESS_DELAY_MS = 600

const attempts = ref(0)
const selected = ref<string | undefined>(undefined)
const isCorrect = ref(false)
const options = ref<string[]>([])

let startTime = performance.now()
let firstClickMs: number | null = null

function reset() {
  attempts.value = 0
  selected.value = undefined
  isCorrect.value = false
  options.value = Math.random() < 0.5 ? [props.country, props.distractor] : [props.distractor, props.country]
  startTime = performance.now()
  firstClickMs = null
}

watch(() => [props.country, props.distractor], reset, { immediate: true })

function handleSelect(option: string) {
  if (isCorrect.value) return

  attempts.value += 1
  if (firstClickMs === null) firstClickMs = performance.now() - startTime
  selected.value = option

  if (option === props.country) {
    isCorrect.value = true
    window.setTimeout(() => {
      emit('submitted', {
        type: 'identify-country',
        country: props.country,
        numberOfClicksNeeded: attempts.value,
        msToFirstClick: firstClickMs ?? 0
      })
    }, SUCCESS_DELAY_MS)
  }
}
</script>

<template>
  <div class="relative h-full w-full">
    <div class="absolute inset-0">
      <WorldMapCanvas
        :geo-data="geoData"
        :highlight-country="country"
        :highlight-color="MARKER_COLOR"
        :marker-country="country"
        :marker-color="MARKER_COLOR"
      />
    </div>
    <div class="pointer-events-none absolute inset-x-0 top-0 flex justify-center px-3 pt-20 sm:pt-24">
      <div
        class="card card-border pointer-events-auto bg-base-100/90 p-3 text-center shadow-sm backdrop-blur"
        :class="{ 'bg-success/10': isCorrect }"
      >
        <p class="text-sm font-medium">
          {{ t('exercise.instructionIdentify') }}
        </p>
      </div>
    </div>
    <div class="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-3 sm:p-6">
      <div class="pointer-events-auto grid grid-cols-2 gap-3">
        <button
          v-for="option in options"
          :key="option"
          type="button"
          class="btn shadow-sm backdrop-blur"
          :class="[
            option === selected ? (isCorrect ? 'btn-success' : 'btn-error') : 'btn-outline bg-base-100/90',
            isCorrect || option === selected ? 'pointer-events-none' : ''
          ]"
          @click="handleSelect(option)"
        >
          {{ getCountryDisplayName(geoData, option) }}
        </button>
      </div>
    </div>
  </div>
</template>
