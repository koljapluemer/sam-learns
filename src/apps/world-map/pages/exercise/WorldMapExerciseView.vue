<script setup lang="ts">
import { ref, watch } from 'vue'
import type { FeatureCollection } from 'geojson'
import { useAppI18n } from '@/apps/world-map/app/i18n'
import WorldMapCanvas from '@/apps/world-map/dumb/WorldMapCanvas.vue'
import { getCountryDisplayName } from '@/apps/world-map/dumb/mapProjection'
import { SUCCESS_COLOR } from '@/apps/world-map/dumb/mapStyle'
import type { SubmittedAnswer } from '@/apps/world-map/entities/progress/progressScheduler'

const props = defineProps<{
  geoData: FeatureCollection
  country: string
}>()

const emit = defineEmits<{
  submitted: [result: SubmittedAnswer]
}>()

const { t } = useAppI18n()

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
}
</script>

<template>
  <div class="relative h-full w-full">
    <div class="absolute inset-0">
      <WorldMapCanvas
        :geo-data="geoData"
        :target-country="country"
        :highlight-country="highlightCountry"
        :highlight-color="highlightColor"
        interactive
        @country-clicked="handleClick"
      />
    </div>
    <div class="pointer-events-none absolute inset-x-0 top-0 flex justify-center px-3 pt-20 sm:pt-24">
      <div
        class="card card-border pointer-events-auto bg-base-100/90 p-3 text-center shadow-sm backdrop-blur"
        :class="{ 'bg-success/10': isCorrect }"
      >
        <p class="text-sm font-medium">
          {{ t('exercise.instructionWorldMap', { country: getCountryDisplayName(geoData, country) }) }}
        </p>
      </div>
    </div>
  </div>
</template>
