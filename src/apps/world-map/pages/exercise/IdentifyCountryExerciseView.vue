<script setup lang="ts">
import { ref, watch } from 'vue'
import type { FeatureCollection } from 'geojson'
import { useAppI18n } from '@/apps/world-map/app/i18n'
import WorldMapCanvas from '@/apps/world-map/dumb/WorldMapCanvas.vue'
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
  <div class="flex flex-col gap-3">
    <div
      class="card card-border bg-base-100 p-3 text-center shadow-sm"
      :class="{ 'bg-success/10': isCorrect }"
    >
      <p class="text-sm font-medium">
        {{ t('exercise.instructionIdentify') }}
      </p>
    </div>
    <div class="h-[60vh] w-full overflow-hidden rounded-box border border-base-300">
      <WorldMapCanvas
        :geo-data="geoData"
        :highlight-country="country"
        :highlight-color="MARKER_COLOR"
        :marker-country="country"
        :marker-color="MARKER_COLOR"
      />
    </div>
    <div class="grid grid-cols-2 gap-3">
      <button
        v-for="option in options"
        :key="option"
        type="button"
        class="btn"
        :class="[
          option === selected ? (isCorrect ? 'btn-success' : 'btn-error') : 'btn-outline',
          isCorrect || option === selected ? 'pointer-events-none' : ''
        ]"
        @click="handleSelect(option)"
      >
        {{ option }}
      </button>
    </div>
  </div>
</template>
