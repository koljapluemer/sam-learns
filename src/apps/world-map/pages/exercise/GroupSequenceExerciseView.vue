<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { FeatureCollection } from 'geojson'
import { useAppI18n } from '@/apps/world-map/app/i18n'
import WorldMapCanvas from '@/apps/world-map/dumb/WorldMapCanvas.vue'
import { getCountryDisplayName } from '@/apps/world-map/dumb/mapProjection'
import { submitAnswer, type SubmittedAnswer } from '@/apps/world-map/entities/progress/progressScheduler'

const props = defineProps<{
  geoData: FeatureCollection
  groupId: string
  countries: string[]
}>()

const emit = defineEmits<{
  submitted: [result: SubmittedAnswer]
}>()

const { t } = useAppI18n()

const SUCCESS_DELAY_MS = 600

const stepIndex = ref(0)
const attempts = ref(0)
const selected = ref<string | undefined>(undefined)
const isCorrect = ref(false)
const options = ref<string[]>([])

let startTime = performance.now()
let firstClickMs: number | null = null

const currentCountry = computed(() => props.countries[stepIndex.value])
const isLastStep = computed(() => stepIndex.value === props.countries.length - 1)

function pickDistractor(): string {
  const others = props.countries.filter((country) => country !== currentCountry.value)
  return others[Math.floor(Math.random() * others.length)]
}

function resetStep() {
  attempts.value = 0
  selected.value = undefined
  isCorrect.value = false
  options.value = Math.random() < 0.5 ? [currentCountry.value, pickDistractor()] : [pickDistractor(), currentCountry.value]
  startTime = performance.now()
  firstClickMs = null
}

watch(() => [props.groupId, props.countries], () => {
  stepIndex.value = 0
  resetStep()
}, { immediate: true })

async function handleSelect(option: string) {
  if (isCorrect.value) return

  attempts.value += 1
  if (firstClickMs === null) firstClickMs = performance.now() - startTime
  selected.value = option

  if (option !== currentCountry.value) return

  isCorrect.value = true
  const result: SubmittedAnswer = {
    type: 'group-sequence',
    country: currentCountry.value,
    groupId: props.groupId,
    numberOfClicksNeeded: attempts.value,
    msToFirstClick: firstClickMs ?? 0
  }

  window.setTimeout(async () => {
    if (isLastStep.value) {
      emit('submitted', result)
      return
    }
    await submitAnswer(result)
    stepIndex.value += 1
    resetStep()
  }, SUCCESS_DELAY_MS)
}
</script>

<template>
  <div class="relative h-full w-full">
    <div class="absolute inset-0">
      <WorldMapCanvas
        :geo-data="geoData"
        :group-countries="countries"
        :highlight-country="currentCountry"
        :marker-country="currentCountry"
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
        <p class="text-xs text-base-content/60">
          {{ stepIndex + 1 }} / {{ countries.length }}
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
