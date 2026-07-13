<script setup lang="ts">
import { ref, watch } from 'vue'
import type { FeatureCollection } from 'geojson'
import { useAppI18n } from '@/apps/world-map/app/i18n'
import WorldMapCanvas from '@/apps/world-map/dumb/WorldMapCanvas.vue'
import type { SubmittedAnswer } from '@/apps/world-map/entities/progress/progressScheduler'

const props = defineProps<{
  geoData: FeatureCollection
  country: string
}>()

const emit = defineEmits<{
  submitted: [result: SubmittedAnswer]
}>()

const { t } = useAppI18n()

const HINT_COLOR = '#3b82f6'
const SUCCESS_COLOR = '#22c55e'
const SUCCESS_DELAY_MS = 600

const attempts = ref(0)
const highlightCountry = ref<string | undefined>(undefined)
const highlightColor = ref<string | undefined>(undefined)
const isCorrect = ref(false)

let startTime = performance.now()
let firstClickMs: number | null = null

function reset() {
  attempts.value = 0
  highlightCountry.value = undefined
  highlightColor.value = undefined
  isCorrect.value = false
  startTime = performance.now()
  firstClickMs = null
}

watch(() => props.country, reset, { immediate: true })

function handleClick(clickedCountry: string) {
  if (isCorrect.value) return

  attempts.value += 1
  if (firstClickMs === null) firstClickMs = performance.now() - startTime

  if (clickedCountry === props.country) {
    isCorrect.value = true
    highlightCountry.value = props.country
    highlightColor.value = SUCCESS_COLOR
    window.setTimeout(() => {
      emit('submitted', {
        type: 'find-on-world-map',
        country: props.country,
        numberOfClicksNeeded: attempts.value,
        msToFirstClick: firstClickMs ?? 0
      })
    }, SUCCESS_DELAY_MS)
    return
  }

  highlightCountry.value = props.country
  highlightColor.value = HINT_COLOR
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div
      class="card card-border bg-base-100 p-3 text-center shadow-sm"
      :class="{ 'bg-success/10': isCorrect }"
    >
      <p class="text-sm font-medium">
        {{ t('exercise.instructionWorldMap', { country }) }}
      </p>
    </div>
    <div class="h-[60vh] w-full overflow-hidden rounded-box border border-base-300">
      <WorldMapCanvas
        :geo-data="geoData"
        :target-country="country"
        :highlight-country="highlightCountry"
        :highlight-color="highlightColor"
        interactive
        @country-clicked="handleClick"
      />
    </div>
  </div>
</template>
