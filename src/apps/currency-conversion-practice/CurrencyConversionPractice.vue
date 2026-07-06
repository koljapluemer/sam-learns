<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'

const dividend = ref(0)
const divisor = ref(1.2)
const guess = ref(null)
const results = ref([])

const homeCurrency = ref('EUR')
const foreignCurrency = ref('USD')

const isRevealed = ref(false)
const guessInput = ref(null)

function handleGlobalKeydown(event) {
  if (event.key === 'Enter' && isRevealed.value) {
    evaluateScore()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})

generateRandomExercise()

function generateRandomExercise() {
  dividend.value = Math.floor(Math.random() * (800 - 5 + 1) + 5)
  guess.value = null
  isRevealed.value = false
  nextTick(() => guessInput.value?.focus())
}

function evaluateScore() {
  results.value.push({
    date: new Date().toISOString(),
    dividend: dividend.value,
    divisor: divisor.value,
    guess: guess.value,
    correct: dividend.value / divisor.value,
    missedByPercent:
      ((guess.value - dividend.value / divisor.value) /
        (dividend.value / divisor.value)) *
      100
  })
  generateRandomExercise()
}

const width = 400
const height = 200
const margin = 24

const currentError = computed(() => {
  if (guess.value == null || !isRevealed.value) return null
  const correct = dividend.value / divisor.value
  return ((guess.value - correct) / correct) * 100
})

const errorValues = computed(() => {
  const values = results.value.map((point) => point.missedByPercent)

  if (currentError.value != null) {
    values.push(currentError.value)
  }

  return values.length ? values : [-10, 10]
})

const maxX = computed(() => Math.max(20, results.value.length))
const maxY = computed(() => {
  const max = Math.max(...errorValues.value)
  return Math.ceil(max / 10) * 10
})

const minY = computed(() => {
  const min = Math.min(...errorValues.value)
  return Math.floor(min / 10) * 10
})

const scaleX = computed(() => {
  const xRange = maxX.value
  return (x) => (x / xRange) * (width - 2 * margin) + margin
})

const scaleY = computed(() => {
  const yRange = maxY.value - minY.value || 1
  return (y) =>
    height - ((y - minY.value) / yRange) * (height - 2 * margin) - margin
})
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
        <svg
          :viewBox="`0 0 ${width} ${height}`"
          class="h-auto w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <line
            :x1="margin"
            :y1="scaleY(0)"
            :x2="width - margin"
            :y2="scaleY(0)"
            class="stroke-base-content/20"
            stroke-width="1"
          />
          <circle
            v-for="(point, index) in results.slice(-20)"
            :key="point.date"
            :cx="scaleX(index)"
            :cy="scaleY(point.missedByPercent)"
            r="4"
            class="fill-primary"
          />
          <circle
            v-if="isRevealed && currentError != null"
            :cx="scaleX(results.length)"
            :cy="scaleY(currentError)"
            r="5"
            fill="white"
          />
        </svg>
      </div>
    </div>
  </section>
</template>
