<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAppI18n } from '@/apps/triangle-congruence/app/i18n'
import {
  loadNextExercise,
  pickPositiveFeedbackMessageIndex,
  submitClozeAnswer,
  submitIdentifyTheoremAnswer,
  type NextExerciseState
} from '@/apps/triangle-congruence/entities/progress/progressScheduler'
import type { TriangleTheorem } from '@/apps/triangle-congruence/entities/triangle/triangleTypes'
import IdentifyTheoremExerciseView from './IdentifyTheoremExerciseView.vue'
import ClozeExerciseView from './ClozeExerciseView.vue'
import AllLearnedView from './AllLearnedView.vue'

const { t } = useAppI18n()

type PageState = { mode: 'loading' } | ({ mode: 'exercise' } & NextExerciseState)

const state = ref<PageState>({ mode: 'loading' })
const feedbackMessage = ref<string | null>(null)

onMounted(loadNext)

async function loadNext() {
  state.value = { mode: 'loading' }
  feedbackMessage.value = null
  const next = await loadNextExercise(t('cloze.noDistractor'))
  state.value = { mode: 'exercise', ...next }
}

function showPositiveFeedback() {
  feedbackMessage.value = t(`feedback.positive${pickPositiveFeedbackMessageIndex()}`)
}

async function handleIdentifyTheoremSubmitted(topicId: TriangleTheorem, selectedTheorem: TriangleTheorem) {
  const result = await submitIdentifyTheoremAnswer({ topicId, selectedTheorem })
  if (result.isCorrect) {
    showPositiveFeedback()
  }
  await loadNext()
}

async function handleClozeSubmitted(input: {
  topicId: TriangleTheorem
  gapIndex: number
  answerGiven: string
  possibleAnswers: string[]
  isCorrect: boolean
}) {
  await submitClozeAnswer(input)
  if (input.isCorrect) {
    showPositiveFeedback()
  }
  await loadNext()
}
</script>

<template>
  <section class="flex w-full max-w-xl flex-col gap-4">
    <div
      v-if="feedbackMessage"
      class="alert alert-success"
    >
      <span>{{ feedbackMessage }}</span>
    </div>

    <div
      v-if="state.mode === 'loading'"
      class="flex justify-center py-16 text-sm text-base-content/70"
    >
      {{ t('loading.label') }}
    </div>

    <AllLearnedView v-else-if="state.kind === 'all-learned'" />

    <IdentifyTheoremExerciseView
      v-else-if="state.kind === 'identify-theorem'"
      :key="`${state.topicId}-${state.exercise.figure1.points.map((p) => p.x).join(',')}`"
      :topic-id="state.topicId"
      :show-explanations="state.showExplanations"
      :exercise="state.exercise"
      @submitted="handleIdentifyTheoremSubmitted"
    />

    <ClozeExerciseView
      v-else-if="state.kind === 'cloze'"
      :key="`${state.exercise.topicId}-${state.exercise.gapIndex}-${state.exercise.mode}`"
      :exercise="state.exercise"
      @submitted="handleClozeSubmitted"
    />
  </section>
</template>
