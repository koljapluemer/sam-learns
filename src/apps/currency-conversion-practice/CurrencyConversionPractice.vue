<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { logActivity } from '@/shared/activity/useLearningEvent'
import { useActiveTime } from '@/shared/activity/useActiveTime'
import { useLocalSetting } from '@/shared/settings/useLocalSetting'
import { getAllTrials, recordTrial, RECENT_TRIAL_COUNT } from './entities/trial/trialRepository'
import PointCloudChart from './dumb/PointCloudChart.vue'
import type { TrialRow } from './db/appDb'

useActiveTime('currency-conversion-practice')

const MAGNITUDES = [0.0001, 0.001, 0.01, 0.1, 1, 10, 100, 1000, 10000, 100000, 1000000]

function formatMagnitude(magnitude: number): string {
  return magnitude >= 1 ? magnitude.toLocaleString('en-US') : magnitude.toString()
}

const minMagnitude = useLocalSetting('currency-conversion-practice-min-magnitude', 1)
const maxMagnitude = useLocalSetting('currency-conversion-practice-max-magnitude', 1000)

const dividend = ref(0)
const divisor = ref(1.2)
const guess = ref<number | null>(null)
const results = ref<TrialRow[]>([])

const homeCurrency = ref('EUR')
const foreignCurrency = ref('USD')

const isRevealed = ref(false)
const guessInput = ref<HTMLInputElement | null>(null)

function handleGlobalKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && isRevealed.value) {
    evaluateScore()
  }
}

onMounted(async () => {
  window.addEventListener('keydown', handleGlobalKeydown)
  results.value = await getAllTrials()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})

generateRandomExercise()

function generateRandomExercise() {
  dividend.value = randomExerciseValue()
  guess.value = null
  isRevealed.value = false
  nextTick(() => guessInput.value?.focus())
}

function randomExerciseValue(): number {
  const minIndex = MAGNITUDES.indexOf(minMagnitude.value)
  const maxIndex = MAGNITUDES.indexOf(maxMagnitude.value)
  const lowIndex = Math.min(minIndex, maxIndex)
  const highIndex = Math.max(minIndex, maxIndex)
  const magnitude = MAGNITUDES[lowIndex + Math.floor(Math.random() * (highIndex - lowIndex + 1))]

  const firstDigit = Math.floor(Math.random() * 9) + 1
  const secondDigit = Math.floor(Math.random() * 10)
  const mantissa = firstDigit * 10 + secondDigit

  return Number(((mantissa * magnitude) / 10).toPrecision(2))
}

function evaluateScore() {
  if (guess.value == null) return

  const correct = dividend.value / divisor.value
  const trial: Omit<TrialRow, 'id'> = {
    date: new Date().toISOString(),
    dividend: dividend.value,
    divisor: divisor.value,
    guess: guess.value,
    correct,
    missedByPercent: ((guess.value - correct) / correct) * 100
  }

  results.value.push({ id: crypto.randomUUID(), ...trial })
  void recordTrial(trial)
  void logActivity('currency-conversion-practice')
  generateRandomExercise()
}

const currentError = computed(() => {
  if (guess.value == null || !isRevealed.value) return null
  const correct = dividend.value / divisor.value
  return ((guess.value - correct) / correct) * 100
})

const recentValues = computed(() => results.value.slice(-RECENT_TRIAL_COUNT).map((point) => point.missedByPercent))
</script>

<template>
  <section class="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
    <header class="space-y-2">
      <p class="text-sm uppercase tracking-[0.3em] text-base-content/60">
        Mental Math
      </p>
      <h1 class="text-3xl font-semibold">
        Currency conversion practice
      </h1>
      <p class="max-w-2xl text-sm text-base-content/70">
        Estimate the home-currency value before revealing the answer, then track how far off you were.
      </p>
    </header>

    <details class="collapse collapse-arrow rounded-box border border-base-300 bg-base-100 shadow-sm">
      <summary class="collapse-title text-sm font-medium py-3 min-h-0">
        {{ foreignCurrency }} → {{ homeCurrency }} @ {{ divisor }}
      </summary>
      <div class="collapse-content flex flex-col gap-2 pb-4">
        <div class="flex gap-2">
          <input
            v-model="foreignCurrency"
            type="text"
            class="input input-sm flex-1"
            placeholder="Foreign"
          >
          <input
            v-model="homeCurrency"
            type="text"
            class="input input-sm flex-1"
            placeholder="Home"
          >
        </div>
        <input
          v-model="divisor"
          type="number"
          class="input input-sm"
          placeholder="Rate"
          step="0.01"
        >
        <div class="flex gap-2">
          <label class="flex flex-1 flex-col gap-1">
            <span class="text-xs opacity-70">Min magnitude</span>
            <select
              v-model="minMagnitude"
              class="select select-sm"
            >
              <option
                v-for="magnitude in MAGNITUDES"
                :key="magnitude"
                :value="magnitude"
              >
                {{ formatMagnitude(magnitude) }}
              </option>
            </select>
          </label>
          <label class="flex flex-1 flex-col gap-1">
            <span class="text-xs opacity-70">Max magnitude</span>
            <select
              v-model="maxMagnitude"
              class="select select-sm"
            >
              <option
                v-for="magnitude in MAGNITUDES"
                :key="magnitude"
                :value="magnitude"
              >
                {{ formatMagnitude(magnitude) }}
              </option>
            </select>
          </label>
        </div>
      </div>
    </details>

    <div class="card border border-base-300 bg-base-100 shadow-sm">
      <div class="card-body gap-4 p-6">
        <h2 class="text-2xl font-bold md:text-3xl">
          {{ dividend }} {{ foreignCurrency }} = ?
        </h2>

        <div
          v-if="isRevealed"
          class="text-lg opacity-80"
        >
          You guessed <span class="font-semibold">{{ guess }}</span>.
          It&apos;s <span class="font-semibold text-primary">{{ (dividend / divisor).toFixed(2) }}</span>
          {{ homeCurrency }}.
          <span
            class="mt-1 block text-sm"
            :class="currentError !== null && Math.abs(currentError) < 1 ? 'text-success' : ''"
          >
            <template v-if="currentError !== null && Math.abs(currentError) < 1">
              Spot on!
            </template>
            <template v-else-if="currentError !== null">
              {{ Math.abs(currentError).toFixed(0) }}% too {{ currentError > 0 ? 'high' : 'low' }}
            </template>
          </span>
        </div>

        <div class="mt-2 flex gap-2">
          <input
            v-if="!isRevealed"
            ref="guessInput"
            v-model="guess"
            type="number"
            class="input input-bordered flex-1 text-xl"
            :placeholder="homeCurrency"
            @keyup.enter="guess != null && (isRevealed = true)"
          >
          <button
            v-if="!isRevealed"
            class="btn btn-primary"
            @click="isRevealed = true"
          >
            Check <kbd class="kbd kbd-xs ml-1">↵</kbd>
          </button>
          <button
            v-else
            class="btn btn-primary flex-1"
            @click="evaluateScore"
          >
            Next <kbd class="kbd kbd-xs ml-1">↵</kbd>
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="results.length || isRevealed"
      class="card border border-base-300 bg-base-100 shadow-sm"
    >
      <div class="card-body p-4">
        <PointCloudChart
          :values="recentValues"
          :highlight-value="isRevealed ? currentError : null"
        />
      </div>
    </div>
  </section>
</template>
