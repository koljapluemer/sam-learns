<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useAppI18n } from '@/apps/triangle-congruence/app/i18n'
import { levenshteinDistance } from '@/apps/triangle-congruence/dumb/levenshtein'
import type { ClozeExercise } from '@/apps/triangle-congruence/entities/cloze/clozeTypes'
import type { TriangleTheorem } from '@/apps/triangle-congruence/entities/triangle/triangleTypes'

const props = defineProps<{
  exercise: ClozeExercise
}>()

const emit = defineEmits<{
  submitted: [
    input: {
      topicId: TriangleTheorem
      gapIndex: number
      answerGiven: string
      possibleAnswers: string[]
      isCorrect: boolean
    }
  ]
}>()

const { t } = useAppI18n()

function submit(answerGiven: string, possibleAnswers: string[], isCorrect: boolean) {
  emit('submitted', { topicId: props.exercise.topicId, gapIndex: props.exercise.gapIndex, answerGiven, possibleAnswers, isCorrect })
}

// --- multiple-choice mode ---
const selectedWrong = ref(new Set<string>())
const foundCorrectMc = ref(false)
const wasFirstTryMc = ref(true)

async function handleOptionClick(option: string) {
  if (foundCorrectMc.value) return

  if (option === props.exercise.correctAnswer) {
    foundCorrectMc.value = true
    await new Promise((resolve) => window.setTimeout(resolve, 200))
    submit(props.exercise.correctAnswer, props.exercise.options ?? [], wasFirstTryMc.value)
  } else {
    selectedWrong.value.add(option)
    wasFirstTryMc.value = false
  }
}

// --- freetext mode ---
const answer = ref('')
const foundCorrectFreetext = ref(false)
const wasFirstTryFreetext = ref(true)
const usedTip = ref(false)
const revealedLetters = ref(new Set<number>())
const cooldownRemaining = ref(0)
let cooldownInterval: number | null = null

const correctAnswer = computed(() => props.exercise.correctAnswer)

const inputClass = computed(() => {
  if (foundCorrectFreetext.value) return 'input-success'
  return ''
})

const displayedHint = computed(() =>
  correctAnswer.value
    .split('')
    .map((letter, index) => (revealedLetters.value.has(index) ? letter : '_'))
    .join(' ')
)

function startCooldown(durationMs: number) {
  cooldownRemaining.value = durationMs
  const endTime = Date.now() + durationMs
  if (cooldownInterval !== null) window.clearInterval(cooldownInterval)
  cooldownInterval = window.setInterval(() => {
    const remaining = endTime - Date.now()
    if (remaining <= 0) {
      if (cooldownInterval !== null) window.clearInterval(cooldownInterval)
      cooldownRemaining.value = 0
    } else {
      cooldownRemaining.value = remaining
    }
  }, 100)
}

function getRandomUnrevealedIndex(): number | undefined {
  const indices: number[] = []
  for (let i = 0; i < correctAnswer.value.length; i += 1) {
    if (!revealedLetters.value.has(i)) indices.push(i)
  }
  return indices[Math.floor(Math.random() * indices.length)]
}

function revealLetter() {
  if (revealedLetters.value.size >= correctAnswer.value.length) return
  const index = getRandomUnrevealedIndex()
  if (index === undefined) return
  revealedLetters.value.add(index)
  usedTip.value = true
  startCooldown(5000)
}

async function checkAnswer() {
  if (foundCorrectFreetext.value) return

  const distance = levenshteinDistance(answer.value.toLowerCase(), correctAnswer.value.toLowerCase())

  if (distance <= 1) {
    foundCorrectFreetext.value = true
    answer.value = correctAnswer.value
    await new Promise((resolve) => window.setTimeout(resolve, 200))
    submit(correctAnswer.value, [correctAnswer.value], wasFirstTryFreetext.value && !usedTip.value)
  } else {
    wasFirstTryFreetext.value = false
  }
}

onMounted(() => {
  if (props.exercise.mode === 'freetext') {
    startCooldown(5000)
  }
})

onUnmounted(() => {
  if (cooldownInterval !== null) window.clearInterval(cooldownInterval)
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      class="card border border-base-300 bg-base-100 p-6"
      :class="{ 'border-success bg-success/10': foundCorrectMc || foundCorrectFreetext }"
    >
      <h1 class="mb-4 text-center text-lg font-semibold">
        {{ t('cloze.heading') }}
      </h1>
      <p class="text-center text-xl">
        {{ exercise.clozeText }}
      </p>
    </div>

    <div
      v-if="exercise.mode === 'multiple-choice'"
      class="flex flex-col gap-2"
    >
      <button
        v-for="option in exercise.options"
        :key="option"
        type="button"
        class="btn w-full"
        :class="{
          'btn-success': foundCorrectMc && option === exercise.correctAnswer,
          'btn-disabled': selectedWrong.has(option) && option !== exercise.correctAnswer
        }"
        :disabled="selectedWrong.has(option) || foundCorrectMc"
        @click="handleOptionClick(option)"
      >
        {{ option }}
      </button>
    </div>

    <div
      v-else
      class="flex flex-col gap-3"
    >
      <input
        v-model="answer"
        type="text"
        class="input input-bordered w-full"
        :class="inputClass"
        :disabled="foundCorrectFreetext"
        :placeholder="t('cloze.answerPlaceholder')"
        @keyup.enter="checkAnswer"
      >
      <button
        type="button"
        class="btn btn-primary w-full"
        :disabled="foundCorrectFreetext"
        @click="checkAnswer"
      >
        {{ t('cloze.checkAnswer') }}
      </button>

      <div
        v-if="revealedLetters.size > 0"
        class="text-center text-2xl tracking-widest text-info"
      >
        {{ displayedHint }}
      </div>

      <button
        v-if="!cooldownRemaining && !foundCorrectFreetext && revealedLetters.size < correctAnswer.length"
        type="button"
        class="btn btn-ghost w-full"
        @click="revealLetter"
      >
        {{ t('cloze.revealLetter') }}
      </button>
    </div>
  </div>
</template>
